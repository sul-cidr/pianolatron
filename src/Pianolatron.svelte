<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > div:first-child {
      flex: 1 0 auto;
      position: relative;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: auto 1fr auto;
      grid-template-areas: "left center right";
    }
  }

  .listen-app {
    height: calc(100vh - 220px);
  }
  .perform-app {
    height: calc(100vh - 170px);
  }
  .embed-app {
    height: 100vh;
  }

  :global(#left-sidebar) {
    grid-area: left;

    p {
      opacity: 0.5;
      padding: 0.5em 1em;
    }
  }

  #roll {
    position: relative;
    display: flex;
    flex-direction: column;
    grid-area: center;
  }

  :global(#right-sidebar) {
    grid-area: right;
  }

  #keyboard-container {
    flex: 0 1 auto;
    user-select: none;
  }

  #keyboard-overlay {
    position: absolute;
    bottom: 0;
    width: calc(100% - var(--navigator-width));
    opacity: 0.5;
    // z-index: z($main-context, keyboard-overlay);
  }
</style>

<script>
  import { onMount } from "svelte";
  import { quartInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import {
    appMode,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
    playbackProgressStart,
    playbackProgressEnd,
    currentTick,
    expressionBox,
    holesIntervalTree,
    isReproducingRoll,
    playExpressionsOnOff,
    recordingInBuffer,
    recordingOnOff,
    rollMetadata,
    rollPedalingOnOff,
    scrollDownwards,
    useInAppExpression,
    userSettings,
    playRepeat,
  } from "./stores";
  import { clamp, getMode, getPathJoiner, RecordingActions } from "./lib/utils";
  import expressionBoxes from "./expression-boxes";
  import { processHoleData } from "./lib/hole-data";
  import SamplePlayer from "./components/SamplePlayer.svelte";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import KeyboardControls from "./components/KeyboardControls.svelte";
  import KeyboardShortcuts from "./components/KeyboardShortcuts.svelte";
  import KeyboardShortcutEditor from "./components/KeyboardShortcutEditor.svelte";
  import GameController from "./components/GameController.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import ListenerPanel from "./components/ListenerPanel.svelte";
  import Notification, {
    notify,
    clearNotification,
  } from "./ui-components/Notification.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";
  import LoadingSpinner from "./ui-components/LoadingSpinner.svelte";
  import RollPlayerControls from "./components/RollPlayerControls.svelte";
  import catalog from "./config/catalog.json";

  export let mode;

  const joinPath = getPathJoiner(import.meta.env.BASE_URL);

  let firstLoad = true;
  let appReady = false;
  let appWaiting = false;
  let appLoaded = false;
  let rollImageReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let metadata;

  let samplePlayer;

  let midiSamplePlayer;
  let pianoReady;
  let updatePlayer;
  let startNote;
  let stopNote;
  let pausePlayback;
  let startPlayback;
  let resetPlayback;
  let recordingControl;

  let rollViewer;
  let updateTickByViewportIncrement;
  let panHorizontal;
  let adjustZoom;

  const progressPercentageToTick = (percentage = 0) =>
    Math.floor(midiSamplePlayer.totalTicks * percentage);

  // redundant, but the way the BasicSettings comp is built requires we define the func
  // here, as it won't update the ref.
  const skipToPercentage = (percentage = 0) =>
    skipToTick(progressPercentageToTick(percentage));

  const skipToTick = (tick) => {
    if (tick < 0) pausePlayback();
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  const rollListItems = catalog.map((item) => ({
    ...item,
    _label: `${item.number} ${item.title} [${item.publisher}]`,
  }));

  const slide = (node, { delay = 0, duration = 300 }) => {
    const o = parseInt(getComputedStyle(node).height, 10);
    return {
      delay,
      duration,
      css: (t) => `height: ${quartInOut(t) * o}px`,
    };
  };

  const playPauseApp = () => {
    if (midiSamplePlayer.isPlaying()) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const stopApp = () => {
    pausePlayback();
    resetPlayback();
  };

  const resetApp = () => {
    rollViewer?.$destroy();
    mididataReady = false;
    if (!firstLoad) clearNotification();
    appReady = false;
    pausePlayback();
    resetPlayback();
    playbackProgress.reset();
    tempoCoefficient.reset();
    bassVolumeCoefficient.reset();
    trebleVolumeCoefficient.reset();
    $holesIntervalTree = new IntervalTree();
  };

  const loadRoll = (roll, doReset = true) => {
    appWaiting = true;
    mididataReady = fetch(
      `/${$useInAppExpression ? "note_midi" : "midi"}/${roll.druid}.mid`,
    )
      .then((mididataResponse) => {
        if (mididataResponse.status === 200)
          return mididataResponse.arrayBuffer();
        throw new Error("Error fetching MIDI file! (Operation cancelled)");
      })
      .then((mididataArrayBuffer) => {
        if (doReset) resetApp();
        midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);
      })
      .then(() => {
        // Configure and hook-up expression box
        const expressionBoxType = $useInAppExpression
          ? $rollMetadata.ROLL_TYPE
          : "expressiveMidi";
        $expressionBox = new expressionBoxes[expressionBoxType](
          midiSamplePlayer,
          startNote,
          stopNote,
        );
        // This is a tiny bit hacky (in the sense that it's using an undocumented
        //  api), but it's a simple way to ensure that only one midiEventHandler
        //  is registered.
        midiSamplePlayer.eventListeners.midiEvent = [
          $expressionBox.midiEventHandler,
        ];
      })
      .catch((err) => {
        notify({ title: "MIDI Data Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    metadataReady = fetch(joinPath("json", `${roll.druid}.json`))
      .then((metadataResponse) => {
        if (metadataResponse.status === 200) return metadataResponse.json();
        throw new Error("Error fetching metadata file! (Operation cancelled)");
      })
      .catch((err) => {
        notify({ title: "Metadata Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    return Promise.all([mididataReady, metadataReady, pianoReady]).then(
      ([, metadataJson]) => {
        metadata = (({ holeData: _, ...obj }) => obj)(metadataJson);
        $holesIntervalTree = processHoleData(
          metadataJson.holeData,
          $rollMetadata,
          $scrollDownwards,
          $expressionBox.noteVelocitiesMap,
        );
        if (doReset) {
          $playExpressionsOnOff = $isReproducingRoll;
          $rollPedalingOnOff = $isReproducingRoll;
        }
        appReady = true;
        appWaiting = false;
        firstLoad = false;
        document.querySelector("#loading span").textContent =
          "Loading roll image...";
        previousRoll = currentRoll;
        const params = new URLSearchParams(window.location.search);
        if (params.has("druid") && params.get("druid") !== currentRoll.druid) {
          const url = new URL(window.location);
          url.searchParams.delete("start");
          url.searchParams.delete("end");
          playbackProgressStart.reset();
          playbackProgressEnd.reset();
          url.searchParams.set("druid", currentRoll.druid);
          window.history.pushState({ roll: currentRoll }, "", url);
        }
      },
    );
  };

  const validateStartParam = (start) => {
    start = Number(start) / 100;
    if (start < 0 || start >= 1) {
      start = 0;
    }
    return start;
  };

  const validateEndParam = (end, start) => {
    end = Number(end) / 100;
    if (end <= 0 || end > 1 || start >= end) {
      end = 1;
    }
    return end;
  };

  const reloadRoll = () => {
    const savedTick = $currentTick;
    let startPlayer = false;
    if (midiSamplePlayer.isPlaying()) {
      pausePlayback();
      startPlayer = true;
    }
    loadRoll(currentRoll, false).then(() => {
      rollViewer.partitionOverlaySvgs();
      rollViewer.updateVisibleOverlays();
      skipToTick(savedTick);
      if (startPlayer) startPlayback();
    });
  };

  const setCurrentRollFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("druid")) {
      const druid = params.get("druid");
      const roll = rollListItems.find((r) => r.druid === druid);
      if (roll !== undefined) {
        currentRoll = roll;
      } else {
        notify({
          title: "DRUID not found!",
          message:
            "Please check the specified DRUID, or select a roll to continue.",
          type: "error",
          closable: false,
        });
      }

      if (params.has("start")) {
        playbackProgressStart.set(validateStartParam(params.get("start")));
      } else {
        playbackProgressStart.reset();
      }

      if (params.has("end")) {
        playbackProgressEnd.set(
          validateEndParam(params.get("end"), $playbackProgressStart),
        );
      } else {
        playbackProgressEnd.reset();
      }
    } else {
      currentRoll =
        rollListItems[Math.floor(Math.random() * rollListItems.length)];
      const url = new URL(window.location);
      url.searchParams.set("druid", currentRoll.druid);
      window.history.pushState({}, "", url);
    }
  };

  const exportRecordingMIDI = () =>
    recordingControl(RecordingActions.ExportMIDI);
  const exportRecordingWAV = () => recordingControl(RecordingActions.ExportWAV);
  const clearRecording = () => recordingControl(RecordingActions.Clear);

  const toggleRecording = () => {
    $recordingOnOff = !$recordingOnOff;
    if ($recordingInBuffer && !$recordingOnOff) {
      notify({
        title: "Recording Complete.",
        message: "",
        closable: true,
        actions: [
          {
            label: "Export MIDI Recording ",
            fn: exportRecordingMIDI,
          },
          {
            label: "Export WAV Recording ",
            fn: exportRecordingWAV,
          },
          {
            label: "Clear Recording",
            fn: clearRecording,
          },
          {
            label: "Continue",
            fn: clearNotification,
          },
        ],
      });
    }
  };

  onMount(async () => {
    document.querySelector("#loading span").textContent =
      "Loading resources...";

    $appMode = getMode(mode);

    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      pausePlayback,
      startPlayback,
      resetPlayback,
      recordingControl,
    } = samplePlayer);

    setCurrentRollFromUrl();
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: if (appLoaded && $playbackProgressStart > 0) {
    skipToPercentage($playbackProgressStart);
  }
  $: playbackProgress.update(() => {
    return clamp($currentTick / (midiSamplePlayer?.totalTicks || 1), 0, 1);
  });
  $: if (appLoaded && $playbackProgress >= $playbackProgressEnd) {
    $playRepeat ? skipToPercentage($playbackProgressStart) : pausePlayback();
  }
  $: if (rollViewer)
    ({ adjustZoom, updateTickByViewportIncrement, panHorizontal } = rollViewer);
  $: if (rollImageReady) {
    document.querySelector("#loading span").textContent = "Loading complete!";
    document
      .getElementById("loading")
      .addEventListener("transitionend", () =>
        document.getElementById("loading").remove(),
      );
    document.getElementById("loading").classList.add("fade-out");
    appLoaded = true;
  }
  $: appClass = `${$appMode}-app`;
</script>

<div id="app" class={appClass}>
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw" hidden={false}>
      {#if $appMode === "perform"}<RollSelector
          bind:currentRoll
          {rollListItems}
        />{/if}
      {#if appReady}
        <RollDetails {metadata} />
        {#if !$holesIntervalTree.count}
          <p>
            Note:<br />Hole visualization data is not available for this roll at
            this time. Hole highlighting will not be enabled.
          </p>
        {/if}
      {/if}
    </FlexCollapsible>
    <div id="roll">
      {#if appReady}
        <RollPlayerControls
          {skipToTick}
          {resetPlayback}
          {playPauseApp}
          {toggleRecording}
        />
        <RollViewer
          bind:this={rollViewer}
          bind:rollImageReady
          imageUrl={currentRoll.image_url}
          {skipToTick}
          {progressPercentageToTick}
          showScaleBar={$appMode === "perform" && $userSettings.showRuler}
        />
      {/if}
      {#if $userSettings.showKeyboard && $userSettings.overlayKeyboard}
        <div id="keyboard-overlay" transition:fade>
          <Keyboard keyCount="88" {startNote} {stopNote} />
        </div>
      {/if}
    </div>
    <FlexCollapsible
      id="right-sidebar"
      width="20vw"
      position="left"
      hidden={!($appMode === "perform")}
    >
      {#if appReady}
        {#if $appMode === "perform"}
          <TabbedPanel
            {playPauseApp}
            {stopApp}
            {skipToPercentage}
            {recordingControl}
            {reloadRoll}
          />
        {:else}
          <ListenerPanel {skipToTick} {playPauseApp} {stopApp} />
        {/if}
      {/if}
    </FlexCollapsible>
  </div>
  {#if $userSettings.showKeyboard && !$userSettings.overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {startNote} {stopNote} />
    </div>
  {:else if !$userSettings.showKeyboard}
    <KeyboardControls outside />
  {/if}
  <LoadingSpinner showLoadingSpinner={appLoaded && appWaiting} />
</div>
<SamplePlayer
  bind:this={samplePlayer}
  on:loading={({ detail: loadingSamples }) => {
    appWaiting = true;
    loadingSamples.then(() => (appWaiting = false)).catch(() => {});
  }}
/>
<KeyboardShortcuts
  {playPauseApp}
  {stopApp}
  {updateTickByViewportIncrement}
  {panHorizontal}
  {toggleRecording}
/>
<KeyboardShortcutEditor />
<Notification />
<GameController
  {playPauseApp}
  {stopApp}
  {updateTickByViewportIncrement}
  {panHorizontal}
  {adjustZoom}
/>

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>

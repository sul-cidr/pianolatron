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
    appWaiting,
    bassVolumeCoefficient,
    expressionParameters,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
    playbackProgressStart,
    playbackProgressEnd,
    currentTick,
    expressionBox,
    holesIntervalTree,
    recordingInBuffer,
    recordingOnOff,
    rollMetadata,
    scrollDownwards,
    useInAppExpression,
    userSettings,
    playRepeat,
    rollBeingBookmarked,
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
  let exportInAppMIDI;

  let rollViewer;
  let updateTickByViewportIncrement;
  let panHorizontal;
  let adjustZoom;

  const progressPercentageToTick = (percentage = 0) =>
    Math.floor(midiSamplePlayer.totalTicks * percentage);

  const skipToTick = (tick) => {
    if (tick < 0) pausePlayback();
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  // redundant, but the way the SamplePlayer comp is built requires we define the func
  // here, as it won't update the ref.
  const skipToPercentage = (percentage = 0) =>
    skipToTick(progressPercentageToTick(percentage));

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
    $appWaiting = true;
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
        // Including a check for the one (so far) 65-note roll...
        if ($rollMetadata.ROLL_TYPE === "65-note") $useInAppExpression = false;
        const expressionBoxType = $useInAppExpression
          ? $rollMetadata.ROLL_TYPE
          : "expressiveMidi";
        if (previousRoll && roll.type !== previousRoll.type)
          $expressionParameters = {};
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
        appReady = true;
        $appWaiting = false;
        firstLoad = false;
        const loadingSpan = document.querySelector("#loading span");
        if (loadingSpan !== null)
          loadingSpan.textContent = "Loading roll image...";
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
    let startPct = Number(start) / 100;
    if (startPct < 0 || startPct >= 1) {
      startPct = 0;
    }
    return startPct;
  };

  const validateEndParam = (end, start) => {
    let endPct = Number(end) / 100;
    if (endPct <= 0 || endPct > 1 || start >= endPct) {
      endPct = 1;
    }
    return endPct;
  };

  const reloadRoll = (resetExpression = false) => {
    const savedTick = $currentTick;
    let startPlayer = false;
    if (midiSamplePlayer.isPlaying()) {
      pausePlayback();
      startPlayer = true;
    }
    if (resetExpression) $expressionParameters = {};

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
        title: "Recording paused, ready for export",
        message: "",
        closable: true,
        actions: [
          {
            label: "Export as MIDI",
            fn: exportRecordingMIDI,
          },
          {
            label: "Export as WAV",
            fn: exportRecordingWAV,
          },
          {
            label: "Clear Recording",
            fn: clearRecording,
          },
          {
            label: "Keep in Buffer",
            fn: clearNotification,
          },
        ],
      });
    }
  };

  const bookmarkRoll = () => {
    $rollBeingBookmarked = true;

    const urlToCopy = new URL(window.location);
    const params = Object.fromEntries(new URLSearchParams(urlToCopy.search));
    delete params.start;
    delete params.end;

    if ($playbackProgressStart >= 0) {
      params.start = ($playbackProgressStart * 100).toFixed(2);
    }
    if ($playbackProgressEnd < 1) {
      params.end = ($playbackProgressEnd * 100).toFixed(2);
    }
    urlToCopy.search = new URLSearchParams(params);

    try {
      window.navigator.clipboard.writeText(urlToCopy.toString());
      notify({
        title: "URL copied to your clipboard!",
        message: urlToCopy.toString(),
        type: "success",
        timeout: 3000,
      });
    } catch {
      notify({
        title: "URL could not be copied to your clipboard!",
        message: "Please copy manually: " + urlToCopy.toString(),
        type: "error",
      });
    }

    setTimeout(() => {
      $rollBeingBookmarked = false;
    }, 1000);
  };

  onMount(async () => {
    const loadingSpan = document.querySelector("#loading span");
    if (loadingSpan !== null) loadingSpan.textContent = "Loading resources...";

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
      exportInAppMIDI,
    } = samplePlayer);

    setCurrentRollFromUrl();
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: if (appLoaded && $playbackProgressStart > 0) {
    skipToPercentage($playbackProgressStart);
  }
  $: playbackProgress.update(() =>
    clamp($currentTick / (midiSamplePlayer?.totalTicks || 1), 0, 1),
  );
  $: if (appLoaded && $playbackProgress >= $playbackProgressEnd) {
    if ($playRepeat) skipToPercentage($playbackProgressStart);
    else pausePlayback();
  }
  $: if (rollViewer)
    ({ adjustZoom, updateTickByViewportIncrement, panHorizontal } = rollViewer);
  $: if (rollImageReady) {
    const loadingSpan = document.querySelector("#loading span");
    if (loadingSpan !== null) loadingSpan.textContent = "Loading complete!";
    const loadingElt = document.getElementById("loading");
    if (loadingElt !== null) {
      loadingElt.addEventListener("transitionend", () => loadingElt.remove());
      loadingElt.classList.add("fade-out");
    }
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
          {bookmarkRoll}
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
    {#if $appMode === "perform"}
      <FlexCollapsible id="right-sidebar" width="20vw" position="left">
        {#if appReady}
          <TabbedPanel {reloadRoll} {exportInAppMIDI} />
        {/if}
      </FlexCollapsible>
    {/if}
  </div>
  {#if $userSettings.showKeyboard && !$userSettings.overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {startNote} {stopNote} />
    </div>
  {:else if !$userSettings.showKeyboard}
    <KeyboardControls outside />
  {/if}
  <LoadingSpinner showLoadingSpinner={appLoaded && $appWaiting} />
</div>
<SamplePlayer
  {metadata}
  bind:this={samplePlayer}
  on:loading={({ detail: loadingSamples }) => {
    $appWaiting = true;
    loadingSamples.then(() => ($appWaiting = false)).catch(() => {});
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
  {bookmarkRoll}
/>

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>

<style lang="scss">
  #app {
    height: 100vh;
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

  :global(#left-sidebar) {
    grid-area: left;

    p {
      opacity: 0.5;
      padding: 0.5em 1em;
    }
  }

  #roll {
    position: relative;
    flex: 1 0 auto;
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
    z-index: z($main-context, keyboard-overlay);
  }
</style>

<script>
  import { onMount } from "svelte";
  import { quartInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import {
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
    currentTick,
    rollMetadata,
    isReproducingRoll,
    scrollDownwards,
    playExpressionsOnOff,
    rollPedalingOnOff,
    userSettings,
  } from "./stores";
  import { annotateHoleData, clamp } from "./lib/utils";
  import SamplePlayer from "./components/SamplePlayer.svelte";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import KeyboardControls from "./components/KeyboardControls.svelte";
  import KeyboardShortcuts from "./components/KeyboardShortcuts.svelte";
  import KeyboardShortcutEditor from "./components/KeyboardShortcutEditor.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import Welcome, { showWelcomeScreen } from "./components/Welcome.svelte";
  import Notification, {
    notify,
    clearNotification,
  } from "./ui-components/Notification.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";
  import LoadingSpinner from "./ui-components/LoadingSpinner.svelte";

  import catalog from "./config/catalog.json";

  let firstLoad = true;
  let appReady = false;
  let appWaiting = true;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let metadata;
  let holeData;
  let holesByTickInterval = new IntervalTree();

  let samplePlayer;

  let midiSamplePlayer;
  let pianoReady;
  let updatePlayer;
  let startNote;
  let stopNote;
  let pausePlayback;
  let startPlayback;
  let resetPlayback;
  let midiRecording;

  let rollViewer;
  let updateTickByViewportIncrement;
  let panHorizontal;

  const rollListItems = catalog.map((item) => {
    const [number, label] = item.label.split(" ");
    return {
      ...item,
      _label: `${number} ${item.title}${label ? ` [${label}]` : ""}`,
    };
  });

  const slide = (node, { delay = 0, duration = 300 }) => {
    const o = parseInt(getComputedStyle(node).height, 10);
    return {
      delay,
      duration,
      css: (t) => `height: ${quartInOut(t) * o}px`,
    };
  };

  const buildHolesIntervalTree = () => {
    const { FIRST_HOLE } = $rollMetadata;

    const firstHolePx = parseInt(FIRST_HOLE, 10);

    holeData.forEach((hole) => {
      const { y: offsetY, h: height } = hole;
      const tickOn = offsetY - firstHolePx;
      const tickOff = offsetY + height - firstHolePx;

      holesByTickInterval.insert(tickOn, tickOff, hole);
    });
  };

  const skipToTick = (tick) => {
    if (tick < 0) pausePlayback();
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  const skipToPercentage = (percentage) =>
    skipToTick(midiSamplePlayer.totalTicks * percentage);

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
    holesByTickInterval = new IntervalTree();
  };

  const recordingControl = (action) => {
    midiRecording(action);
  };

  const loadRoll = (roll) => {
    mididataReady = fetch(`./midi/${roll.druid}.mid`)
      .then((mididataResponse) => {
        if (mididataResponse.status === 200)
          return mididataResponse.arrayBuffer();
        throw new Error("Error fetching MIDI file! (Operation cancelled)");
      })
      .then((mididataArrayBuffer) => {
        resetApp();
        midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);
      })
      .catch((err) => {
        notify({ title: "Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    metadataReady = fetch(`./json/${roll.druid}.json`)
      .then((metadataResponse) => {
        if (metadataResponse.status === 200) return metadataResponse.json();
        throw new Error("Error fetching metadata file! (Operation cancelled)");
      })
      .catch((err) => {
        notify({ title: "Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    Promise.all([mididataReady, metadataReady, pianoReady]).then(
      ([, metadataJson]) => {
        metadata = (({ holeData: _, ...obj }) => obj)(metadataJson);
        holeData = metadataJson.holeData;
        annotateHoleData(holeData, $rollMetadata, $scrollDownwards);
        buildHolesIntervalTree();
        $playExpressionsOnOff = $isReproducingRoll;
        $rollPedalingOnOff = $isReproducingRoll;
        appReady = true;
        appWaiting = false;
        firstLoad = false;
        previousRoll = currentRoll;
        const params = new URLSearchParams(window.location.search);
        if (params.has("druid") && params.get("druid") !== currentRoll.druid) {
          const url = new URL(window.location);
          url.searchParams.set("druid", currentRoll.druid);
          window.history.pushState({ roll: currentRoll }, "", url);
        }
      },
    );
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
    } else {
      currentRoll =
        rollListItems[Math.floor(Math.random() * rollListItems.length)];
    }
  };

  onMount(async () => {
    document.getElementById("loading").remove();
    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      pausePlayback,
      startPlayback,
      resetPlayback,
      midiRecording,
    } = samplePlayer);

    setCurrentRollFromUrl();
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: playbackProgress.update(() =>
    clamp($currentTick / midiSamplePlayer?.totalTicks, 0, 1),
  );
  $: if (rollViewer)
    ({ updateTickByViewportIncrement, panHorizontal } = rollViewer);
</script>

<div id="app">
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw">
      <RollSelector bind:currentRoll {rollListItems} />
      {#if appReady}
        <RollDetails {metadata} />
        {#if !holesByTickInterval.count}
          <p>
            Note:<br />Hole visualization data is not available for this roll at
            this time. Hole highlighting will not be enabled.
          </p>
        {/if}
      {/if}
    </FlexCollapsible>
    <div id="roll">
      {#if appReady}
        <RollViewer
          bind:this={rollViewer}
          imageUrl={currentRoll.image_url}
          {holeData}
          {holesByTickInterval}
          {skipToTick}
        />
      {/if}
      {#if $userSettings.showKeyboard && $userSettings.overlayKeyboard}
        <div id="keyboard-overlay" transition:fade>
          <Keyboard keyCount="88" {startNote} {stopNote} />
        </div>
      {/if}
    </div>
    <FlexCollapsible id="right-sidebar" width="20vw" position="left">
      <TabbedPanel
        {playPauseApp}
        {stopApp}
        {skipToPercentage}
        {recordingControl}
      />
    </FlexCollapsible>
  </div>
  {#if $userSettings.showKeyboard && !$userSettings.overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {startNote} {stopNote} />
    </div>
  {:else if !$userSettings.showKeyboard}
    <KeyboardControls outside />
  {/if}
  <LoadingSpinner showLoadingSpinner={appWaiting} />
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
/>
<KeyboardShortcutEditor />
<Notification />
{#if $showWelcomeScreen}<Welcome />{/if}

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>

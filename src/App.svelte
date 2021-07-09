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
    width: 100%;
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
    activeNotes,
    currentTick,
    rollMetadata,
    showKeyboard,
    overlayKeyboard,
  } from "./stores";
  import { clamp } from "./utils";
  import SamplePlayer from "./components/SamplePlayer.svelte";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import KeyboardControls from "./components/KeyboardControls.svelte";
  import KeyboardShortcuts from "./components/KeyboardShortcuts.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import Notification, { notify } from "./ui-components/Notification.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";

  import catalog from "./assets/catalog.json";

  let appReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
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
    const { FIRST_HOLE, holeData } = $rollMetadata;

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
    mididataReady = false;
    appReady = false;
    pausePlayback();
    resetPlayback();
    playbackProgress.reset();
    tempoCoefficient.reset();
    bassVolumeCoefficient.reset();
    trebleVolumeCoefficient.reset();
    holesByTickInterval = new IntervalTree();
  };

  const loadRoll = (roll) => {
    mididataReady = fetch(`./assets/midi/${roll.druid}.mid`)
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

    metadataReady = fetch(`./assets/json/${roll.druid}.json`)
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
        $rollMetadata = { ...$rollMetadata, ...metadataJson };
        if (metadataJson.holeData)
          buildHolesIntervalTree(metadataJson.holeData);
        appReady = true;
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
            "Please check the specified DRUID, or <a href='/'>click here to continue</a>.",
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
    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      pausePlayback,
      startPlayback,
      resetPlayback,
    } = samplePlayer);

    setCurrentRollFromUrl();
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: playbackProgress.update(() =>
    clamp($currentTick / midiSamplePlayer?.totalTicks, 0, 1),
  );
</script>

<div id="app">
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw">
      <RollSelector bind:currentRoll {rollListItems} />
      {#if appReady}
        <RollDetails />
        {#if !holesByTickInterval.count}
          <p>
            Note:<br />Hole visualization data is not available for this roll at
            this time. Hole highlighting will not be enabled.
          </p>
        {/if}
      {/if}
    </FlexCollapsible>
    {#if appReady}
      <div id="roll">
        <RollViewer
          imageUrl={currentRoll.image_url}
          {holesByTickInterval}
          {skipToTick}
        />
        {#if $showKeyboard && $overlayKeyboard}
          <div id="keyboard-overlay" transition:fade>
            <Keyboard keyCount="88" {activeNotes} {startNote} {stopNote} />
          </div>
        {/if}
      </div>
      <FlexCollapsible id="right-sidebar" width="20vw" position="left">
        <TabbedPanel {playPauseApp} {stopApp} {skipToPercentage} />
      </FlexCollapsible>
    {/if}
  </div>
  {#if $showKeyboard && !$overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {activeNotes} {startNote} {stopNote} />
    </div>
  {:else if !$showKeyboard}
    <KeyboardControls outside />
  {/if}
  {#if !appReady}
    <div id="loading">
      <div><span /> <span /> <span /> <span /> <span /></div>
      Loading resources...
    </div>
  {/if}
</div>
<SamplePlayer bind:this={samplePlayer} />
<KeyboardShortcuts />
<Notification />

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>

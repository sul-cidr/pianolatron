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
  import { quartInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import {
    pedalling,
    volume,
    tempoControl,
    playbackProgress,
    activeNotes,
    currentTick,
    rollMetadata,
    overlayKeyboard,
  } from "./stores";
  import {
    midiSamplePlayer,
    pianoReady,
    updatePlayer,
    startNote,
    stopNote,
    stopAllNotes,
  } from "./components/SamplePlayer";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import Notification, { notify } from "./ui-components/Notification.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";

  let appReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let holesByTickInterval = new IntervalTree();

  const slide = (node, { delay = 0, duration = 300 }) => {
    const o = parseInt(getComputedStyle(node).height, 10);
    return {
      delay,
      duration,
      css: (t) => `height: ${quartInOut(t) * o}px`,
    };
  };

  const buildHolesIntervalTree = () => {
    const { ROLL_TYPE, FIRST_HOLE, IMAGE_LENGTH, holeData } = $rollMetadata;
    const scrollDownwards = ROLL_TYPE === "welte-red";
    const firstHolePx = scrollDownwards
      ? parseInt(FIRST_HOLE, 10)
      : parseInt(IMAGE_LENGTH, 10) - parseInt(FIRST_HOLE, 10);

    holeData.forEach((hole) => {
      const { ORIGIN_ROW, OFF_TIME } = hole;
      const tickOn = scrollDownwards
        ? ORIGIN_ROW - firstHolePx
        : firstHolePx - ORIGIN_ROW;

      const tickOff = scrollDownwards
        ? OFF_TIME - firstHolePx
        : firstHolePx - OFF_TIME;

      holesByTickInterval.insert(tickOn, tickOff, hole);
    });
  };

  const playPauseApp = () => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      stopAllNotes();
      activeNotes.reset();
    } else {
      midiSamplePlayer.play();
    }
  };

  const stopApp = () => {
    midiSamplePlayer.stop();
    stopAllNotes();
    playbackProgress.reset();
    currentTick.reset();
    activeNotes.reset();
    pedalling.reset();
  };

  const resetApp = () => {
    mididataReady = false;
    appReady = false;
    stopApp();
    tempoControl.reset();
    volume.update((val) => ({ ...val, left: 1, right: 1 }));
    holesByTickInterval = new IntervalTree();
  };

  const skipToTick = (tick) => {
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  const skipToPercentage = (percentage) =>
    skipToTick(midiSamplePlayer.totalTicks * percentage);

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
      ({ 1: metadataJson }) => {
        $rollMetadata = { ...$rollMetadata, ...metadataJson };
        if (metadataJson.holeData)
          buildHolesIntervalTree(metadataJson.holeData);
        appReady = true;
        previousRoll = currentRoll;
      },
    );
  };

  $: {
    if (currentRoll !== previousRoll) {
      loadRoll(currentRoll);
    }
  }

  midiSamplePlayer.on("endOfFile", () => stopApp());
  $: playbackProgress.update(() => $currentTick / midiSamplePlayer.totalTicks);
</script>

<div id="app">
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw">
      <RollSelector bind:currentRoll />
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
        {#if $overlayKeyboard}
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
  {#if !$overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {activeNotes} {startNote} {stopNote} />
    </div>
  {/if}
  {#if !appReady}
    <div id="loading">
      <div><span /> <span /> <span /> <span /> <span /></div>
      Loading resources...
    </div>
  {/if}
</div>
<Notification />

<style lang="scss">
  #app {
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "left roll right"
      "keyboard keyboard keyboard";
    height: 100vh;
  }

  #roll-details {
    grid-area: left;
    max-width: calc(348px + 2em);

    p {
      margin: 1em;
      opacity: 0.5;
      padding: 0.5em 1em;
    }
  }

  #roll {
    grid-area: roll;
  }

  #audio-controls {
    grid-area: right;
  }

  #keyboard-container {
    grid-area: keyboard;
  }
</style>

<script>
  import IntervalTree from "node-interval-tree";
  import {
    pedalling,
    volume,
    tempoControl,
    playbackProgress,
    activeNotes,
    currentTick,
    rollMetadata,
  } from "./stores";
  import { midiSamplePlayer, pianoReady } from "./components/SamplePlayer";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import Notification, { notify } from "./ui-components/Notification.svelte";

  let appReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let holesByTickInterval = new IntervalTree();

  const buildHolesIntervalTree = (holeData) => {
    const scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
    const firstHolePx = scrollDownwards
      ? parseInt($rollMetadata.FIRST_HOLE, 10)
      : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
        parseInt($rollMetadata.FIRST_HOLE, 10);

    holeData.forEach((hole) => {
      const tickOn = scrollDownwards
        ? hole.ORIGIN_ROW - firstHolePx
        : firstHolePx - hole.ORIGIN_ROW;

      const tickOff = scrollDownwards
        ? hole.OFF_TIME - firstHolePx
        : firstHolePx - hole.OFF_TIME;

      holesByTickInterval.insert(tickOn, tickOff, hole);
    });
  };

  const playPauseApp = () => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      activeNotes.reset();
    } else {
      midiSamplePlayer.play();
    }
  };

  const stopApp = () => {
    midiSamplePlayer.stop();
    playbackProgress.set(0);
    currentTick.set(0);
    activeNotes.reset();
    pedalling.set({ soft: false, sustain: false });
  };

  const resetApp = () => {
    mididataReady = false;
    appReady = false;
    stopApp();
    tempoControl.set(60);
    volume.update((val) => ({ ...val, left: 1, right: 1 }));
    holesByTickInterval = new IntervalTree();
  };

  const skipToTick = (tick) => {
    $currentTick = tick;
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      midiSamplePlayer.skipToTick($currentTick);
      midiSamplePlayer.play();
    } else {
      midiSamplePlayer.skipToTick($currentTick);
    }
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
  <div id="roll-details">
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
  </div>
  {#if appReady}
    <div id="audio-controls">
      <PlaybackControls {playPauseApp} {stopApp} {skipToPercentage} />
    </div>
    <div id="roll">
      <RollViewer imageUrl={currentRoll.image_url} {holesByTickInterval} />
    </div>
    <div id="keyboard-container">
      <Keyboard keyCount="88" {activeNotes} />
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

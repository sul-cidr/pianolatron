<style>
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
  import {
    pedalling,
    volume,
    tempoControl,
    playbackProgress,
    activeNotes,
    currentTick,
  } from "./stores";
  import { midiSamplePlayer, pianoReady } from "./components/SamplePlayer";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import Notification, { notify } from "./ui-components/Notification.svelte";
  import catalog from "./assets/catalog.json";

  let appReady = false;
  let mididataReady;
  let currentRoll = catalog[Math.floor(Math.random() * catalog.length)];
  let previousRoll;

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
    volume.set({ master: 1, left: 1, right: 1 });
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
        Promise.all([mididataReady, pianoReady]).then(() => {
          appReady = true;
        });
      })
      .catch((err) => {
        notify({ title: "Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    Promise.all([mididataReady, pianoReady]).then(() => {
      appReady = true;
      previousRoll = currentRoll;
    });
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
    {/if}
  </div>
  {#if appReady}
    <div id="audio-controls">
      <PlaybackControls {playPauseApp} {stopApp} {skipToPercentage} />
    </div>
    <div id="roll">
      <RollViewer imageUrl={currentRoll.image_url} />
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

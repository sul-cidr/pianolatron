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

  #loading {
    position: absolute;
    display: grid;
    place-content: center;
    height: 100vh;
    width: 100vw;
    text-align: center;
    color: $primary-accent;
    font-size: 1.4em;

    div {
      width: 100px;
      height: 80px;
      text-align: center;
      font-size: 10px;
      margin: 10px auto;

      span {
        background-color: $primary-accent;
        height: 100%;
        width: 12px;
        display: inline-block;

        animation: pulse 1.2s infinite ease-in-out;

        &:nth-child(2) {
          animation-delay: -1.1s;
        }

        &:nth-child(3) {
          animation-delay: -1s;
        }

        &:nth-child(4) {
          animation-delay: -0.9s;
        }

        &:nth-child(5) {
          animation-delay: -0.8s;
        }
      }
    }
  }

  @keyframes pulse {
    0%,
    40%,
    100% {
      transform: scaleY(0.6);
    }
    20% {
      transform: scaleY(1);
    }
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
  };

  $: {
    if (currentRoll !== previousRoll) {
      loadRoll(currentRoll);
      mididataReady.then(() => {
        previousRoll = currentRoll;
      });
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

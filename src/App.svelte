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
  import Notification, { notify } from "./ui-components/Notification.svelte";

  const title = "Pianolatron Development";

  let appReady = false;
  let mididataReady;
  let currentRoll;
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
  };

  const resetApp = () => {
    mididataReady = false;
    appReady = false;
    stopApp();
    tempoControl.set(60);
    pedalling.set({ soft: false, sustain: false });
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

  $: playbackProgress.update(() => $currentTick / midiSamplePlayer.totalTicks);
</script>

<h1>{title}</h1>
<RollSelector bind:currentRoll />
{#if appReady}
  <RollDetails />
  <PlaybackControls {playPauseApp} {stopApp} {skipToPercentage} />
  <RollViewer imageUrl={currentRoll.image_url} />
{/if}
<Notification />

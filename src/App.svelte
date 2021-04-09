<script>
  import { pedalling, volume, tempoControl, playbackProgress } from "./stores";
  import {
    midiSamplePlayer,
    pianoReady,
    playPauseMidiFile,
    stopMidiFile,
    skipToPercentage,
  } from "./components/SamplePlayer";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";
  import Notification, { notify } from "./ui-components/Notification.svelte";

  const title = "Pianolatron Development";

  let appReady = false;
  let mididataReady;
  let currentRoll;
  let previousRoll;

  const resetApp = () => {
    mididataReady = false;
    appReady = false;
    midiSamplePlayer.stop();
    tempoControl.set(60);
    pedalling.set({ soft: false, sustain: false });
    volume.set({ master: 1, left: 1, right: 1 });
    playbackProgress.set(0);
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
</script>

<h1>{title}</h1>
<RollSelector bind:currentRoll />
{#if appReady}
  <RollDetails />
  <PlaybackControls {playPauseMidiFile} {stopMidiFile} {skipToPercentage} />
{/if}
<Notification />

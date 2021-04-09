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
  let currentRollDruid = "zb497jz4405";

  const resetApp = () => {
    mididataReady = false;
    appReady = false;
    midiSamplePlayer.stop();
    tempoControl.set(60);
    pedalling.set({ soft: false, sustain: false });
    volume.set({ master: 1, left: 1, right: 1 });
    playbackProgress.set(0);
  };

  const loadRoll = (druid) => {
    mididataReady = fetch(`./assets/midi/${druid}.mid`)
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
      });
  };

  $: loadRoll(currentRollDruid);
</script>

<h1>{title}</h1>
<RollSelector bind:currentRollDruid />
{#if appReady}
  <RollDetails />
  <PlaybackControls {playPauseMidiFile} {stopMidiFile} {skipToPercentage} />
{/if}
<Notification />

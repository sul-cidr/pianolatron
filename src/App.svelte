<script>
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

  const title = "Pianolatron Development";

  let mididataReady;
  const loadRoll = (druid) => {
    mididataReady = fetch(`./assets/midi/${druid}.mid`)
      .then((mididataResponse) => mididataResponse.arrayBuffer())
      .then((mididataArrayBuffer) => {
        midiSamplePlayer.stop();
        midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);
      });
  };

  loadRoll("zb497jz4405");

  let appReady = false;
  Promise.all([mididataReady, pianoReady]).then(() => {
    appReady = true;
  });
</script>

<h1>{title}</h1>
{#if appReady}
  <RollSelector {loadRoll} />
  <RollDetails />
  <PlaybackControls {playPauseMidiFile} {stopMidiFile} {skipToPercentage} />
{/if}

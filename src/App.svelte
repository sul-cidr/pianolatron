<script>
  import {
    midiSamplePlayer,
    pianoReady,
    playPauseMidiFile,
    stopMidiFile,
    skipToPercentage
  } from "./components/SamplePlayer";
  import RollDetails from "./components/RollDetails.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";

  const title = "Pianolatron Development";

  let appReady = false;

  // Use the url to fetch the file asynchronously
  const mididataReady = fetch("./assets/mididata.json")
    .then((mididataResponse) => mididataResponse.json())
    .then((mididataJson) =>
      midiSamplePlayer.loadDataUri(mididataJson.mozart_rondo_alla_turca),
    );

  Promise.all([mididataReady, pianoReady]).then(() => {
    appReady = true;
  });
</script>

<h1>{title}</h1>
{#if appReady}
  <RollDetails />
  <PlaybackControls {playPauseMidiFile} {stopMidiFile} {skipToPercentage}/>
{/if}

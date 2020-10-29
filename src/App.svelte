<script>
  import mididataUrl from "url:./assets/mididata.json";

  import {
    midiSamplePlayer,
    rollMetadata,
    playPauseMidiFile,
    stopMidiFile,
  } from "./components/SamplePlayer.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import ScoreControls from "./components/ScoreControls.svelte";

  const title = "Pianolatron!";

  let appReady = false;

  // Use the url to fetch the file asynchronously
  fetch(mididataUrl)
    .then((mididataResponse) => mididataResponse.json())
    .then((mididataJson) =>
      midiSamplePlayer.loadDataUri(mididataJson.mozart_rondo_alla_turca),
    )
    .then(() => {
      appReady = true;
    });
</script>

<h1>{title}</h1>
{#if appReady}
  <RollDetails {rollMetadata} />
  <ScoreControls {playPauseMidiFile} {stopMidiFile} />
{/if}

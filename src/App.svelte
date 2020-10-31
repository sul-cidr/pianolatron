<script>
  import mididataUrl from "url:./assets/mididata.json";

  import {
    midiSamplePlayer,
    playPauseMidiFile,
    stopMidiFile,
  } from "./components/SamplePlayer";
  import RollDetails from "./components/RollDetails.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";

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
  <RollDetails />
  <PlaybackControls {playPauseMidiFile} {stopMidiFile} />
{/if}

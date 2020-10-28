<script>
  import {
    midiSamplePlayer,
    rollMetadata,
  } from "./components/SamplePlayer.svelte";
  import ScoreDetails from "./components/ScoreDetails.svelte";

  import mididata from "./assets/mididata.json";

  const title = "Pianolatron!";

  midiSamplePlayer.loadDataUri(mididata.mozart_rondo_alla_turca);
</script>

<h1>{title}</h1>
<ScoreDetails {rollMetadata} />

<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 1rem;
    gap: 1rem;

    :global(fieldset div),
    :global(fieldset label) {
      display: flex;
      justify-content: space-between;
    }
  }

  #expression-container {
    width: 20vw;
  }

  button {
    @include button;
  }
</style>

<script>
  import { onMount } from "svelte";

  import ExpressionSettings from "./ExpressionSettings.svelte";
  import Keyboard from "./Keyboard.svelte";
  import SamplePlayer from "./SamplePlayer.svelte";

  import expressionBoxes from "../expression-boxes";
  import {
    appWaiting,
    bassVolumeCoefficient,
    expressionParameters,
    trebleVolumeCoefficient,
    expressionBox,
    rollMetadata,
    useInAppExpression,
    userSettings,
  } from "../stores";

  let metadata = {};
  let samplePlayer;
  let midiSamplePlayer;
  let pianoReady;
  let updatePlayer;
  let startNote;
  let stopNote;

  onMount(async () => {
    const loadingSpan = document.querySelector("#loading span");
    if (loadingSpan !== null) loadingSpan.textContent = "Loading resources...";

    // Necessary?
    $useInAppExpression = true;

    // Maybe need to mock this
    $rollMetadata = {
      DRUID: "gq104tn4658",
      ROLL_TYPE: "welte-green",
    };

    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      // pausePlayback,
      // startPlayback,
      // resetPlayback,
      // recordingControl,
      // exportInAppMIDI,
    } = samplePlayer);

    $expressionBox = new expressionBoxes["welte-green"](
      midiSamplePlayer,
      startNote,
      stopNote,
    );

    midiSamplePlayer.eventListeners.midiEvent = [
      $expressionBox.midiEventHandler,
    ];
  });
</script>

<main id="app">
  <div id="keyboard-container">
    <Keyboard keyCount="88" {startNote} {stopNote} />
  </div>
  <div id="expression-container">
    <ExpressionSettings reloadRoll={null} exportInAppMIDI={null} />
  </div>
</main>

<SamplePlayer
  {metadata}
  bind:this={samplePlayer}
  on:loading={({ detail: loadingSamples }) => {
    $appWaiting = true;
    loadingSamples.then(() => ($appWaiting = false)).catch(() => {});
  }}
/>

<style>
  .pedal-on {
    background: yellow;
  }
</style>

<script>
  import { pedalling } from "../stores";

  export let playPauseMidiFile;
  export let stopMidiFile;
</script>

<div id="score-controls">
  <button type="button" on:click={playPauseMidiFile}>Play/Pause</button>
  <button type="button" on:click={stopMidiFile}>Stop</button>
  <button
    type="button"
    class:pedal-on={$pedalling.soft}
    on:click={() => pedalling.update((val) => ({ ...val, soft: !val.soft }))}
  >Soft</button>
  <button
    type="button"
    class:pedal-on={$pedalling.sustain}
    on:click={() => pedalling.update((val) => ({
        ...val,
        sustain: !val.sustain,
      }))}
  >Sustain</button>
</div>

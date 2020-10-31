<style>
  .pedal-on {
    background: yellow;
  }
</style>

<script>
  import { pedalling, volume } from "../stores";

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

  <div>
    Master Volume:
    <input
      type="range"
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.master}
      name="volume"
    />
    {$volume.master}
  </div>
</div>

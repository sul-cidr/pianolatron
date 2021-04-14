<style lang="scss">
  .pedal-on {
    background: yellow;
  }

  .control {
    align-items: center;
    display: flex;
    gap: 0.5em;
    padding: 0.5em 0;

    :first-child {
      width: 8em;
    }

    :global(input[type="range"]) {
      width: 20em;
    }
  }
</style>

<script>
  import { pedalling, volume, tempoControl, playbackProgress } from "../stores";

  import RangeSlider from "../ui-components/RangeSlider.svelte";

  export let playPauseApp;
  export let stopApp;
  export let skipToPercentage;
</script>

<div id="score-controls">
  <button type="button" on:click={playPauseApp}>Play/Pause</button>
  <button type="button" on:click={stopApp}>Stop</button>
  <button
    type="button"
    class:pedal-on={$pedalling.soft}
    aria-pressed={$pedalling.soft}
    on:click={() => pedalling.update((val) => ({ ...val, soft: !val.soft }))}
  >Soft</button>
  <button
    type="button"
    class:pedal-on={$pedalling.sustain}
    aria-pressed={$pedalling.sustain}
    on:click={() => pedalling.update((val) => ({
        ...val,
        sustain: !val.sustain,
      }))}
  >Sustain</button>

  <div class="control">
    <span>Master Volume:</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.master}
      name="volume"
    />
    {$volume.master}
  </div>
  <div class="control">
    <span>Bass Volume:</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.left}
      name="volume"
    />
    {$volume.left}
  </div>
  <div class="control">
    <span>Treble Volume:</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.right}
      name="volume"
    />
    {$volume.right}
  </div>
  <div class="control">
    <span>Tempo:</span>
    <RangeSlider
      min="0"
      max="180"
      step="10"
      bind:value={$tempoControl}
      name="tempo"
    />
    {$tempoControl}
  </div>
  <div class="control">
    <span>Progress:</span>
    <RangeSlider
      min="0"
      max="1"
      step="0.01"
      value={$playbackProgress}
      name="progress"
      on:input={({ target: { value } }) => skipToPercentage(value)}
      mousewheel={false}
    />
    {($playbackProgress * 100).toFixed(2)}%
  </div>
</div>

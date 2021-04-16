<style lang="scss">
  #playback-controls {
    margin: 6em 2em 0 2em;
  }
  .control {
    align-items: center;
    display: grid;
    gap: 0.5em;
    padding: 0.5em 0;
    grid:
      "title value" auto
      "slider slider" auto / 1fr auto;

    :global(input[type="range"]) {
      grid-area: slider;
      width: 100%;
    }
  }

  button {
    display: inline-block;
    padding: 0.35em 0.8em;
    border: 0.1em solid #ffffff;
    margin: 0;
    border-radius: 0.25em;
    color: #ffffff;
    transition: all 0.2s;
    background-color: $primary-accent;

    &:hover,
    &.pedal-on {
      color: $primary-accent;
      border-color: $primary-accent;
      background-color: #ffffff;
    }

    &.pedal-on {
      background-color: yellow;
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

<div id="playback-controls">
  <div class="control">
    <span>Master Volume:</span>
    <span>{$volume.master}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.master}
      name="volume"
    />
  </div>
  <div class="control">
    <span>Bass Volume:</span>
    <span>{$volume.left}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.left}
      name="volume"
    />
  </div>
  <div class="control">
    <span>Treble Volume:</span>
    <span>{$volume.right}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.right}
      name="volume"
    />
  </div>
  <div class="control">
    <span>Tempo:</span>
    <span>{$tempoControl}</span>
    <RangeSlider
      min="0"
      max="180"
      step="10"
      bind:value={$tempoControl}
      name="tempo"
    />
  </div>
  <div class="control">
    <span>Progress:</span>
    <span>{($playbackProgress * 100).toFixed(2)}%</span>
    <RangeSlider
      min="0"
      max="1"
      step="0.01"
      value={$playbackProgress}
      name="progress"
      on:input={({ target: { value } }) => skipToPercentage(value)}
      mousewheel={false}
    />
  </div>

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
  <br />
  <button
    type="button"
    style="width:100%"
    class:pedal-on={$pedalling.accent}
    aria-pressed={$pedalling.accent}
    on:mousedown={() => pedalling.update((val) => ({ ...val, accent: true }))}
  >Accent</button>
</div>
<svelte:window
  on:mouseup={() => pedalling.update((val) => ({ ...val, accent: false }))}
/>

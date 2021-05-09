<style lang="scss">
  #playback-settings {
    overflow-y: auto;
  }
  .control {
    align-items: center;
    display: grid;
    gap: 0.5em;
    padding: 0.5em;
    grid:
      "title value" auto
      "slider slider" auto / 1fr auto;

    :global(input[type="range"]) {
      grid-area: slider;
      width: 100%;
    }
  }
</style>

<script>
  import { volume, tempoControl, playbackProgress } from "../stores";
  import RangeSlider from "../ui-components/RangeSlider.svelte";
  import DialControl from "../ui-components/DialControl.svelte";

  export let skipToPercentage;
</script>

<div id="playback-settings">
  <div class="control">
    <span>Volume:</span>
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
      min="1"
      max="180"
      step="1"
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
      step="0.001"
      value={$playbackProgress}
      name="progress"
      on:input={({ target: { value } }) => skipToPercentage(value)}
      mousewheel={false}
    />
  </div>
  <div style="margin: 2em 0; position: relative;height: 8em;">
    <DialControl />
  </div>
</div>

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

  kbd {
    display: inline-block;
    padding: 5px 5px;
  }
</style>

<script>
  import {
    volumeCoefficient,
    bassVolume,
    trebleVolume,
    tempoCoefficient,
    playbackProgress,
  } from "../stores";
  import RangeSlider from "../ui-components/RangeSlider.svelte";

  export let skipToPercentage;
</script>

<div id="playback-settings">
  <div class="control">
    <span>Volume: <kbd>[</kbd>↓ <kbd>]</kbd>↑</span>
    <span>{$volumeCoefficient}</span>
    <RangeSlider min="0" max="4" step=".1" bind:value={$volumeCoefficient} name="volume" />
  </div>
  <div class="control">
    <span>Bass Volume:</span>
    <span>{$bassVolume}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$bassVolume}
      name="bassVolume"
    />
  </div>
  <div class="control">
    <span>Treble Volume:</span>
    <span>{$trebleVolume}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$trebleVolume}
      name="trebleVolume"
    />
  </div>
  <div class="control">
    <span>Tempo: <kbd>w</kbd>↓ <kbd>e</kbd>↑</span>
    <span>{($tempoCoefficient * 100).toFixed(0)}%</span>
    <RangeSlider
      min="0.1"
      max="4"
      step=".001"
      bind:value={$tempoCoefficient}
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
</div>

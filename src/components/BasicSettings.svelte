<style lang="scss">
  #playback-settings {
    overflow-y: auto;
  }
  .control {
    align-items: center;
    display: grid;
    gap: 0.5em;
    padding: 0 0.5em 0.5em;
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
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import {
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
  } from "../stores";
  import RangeSlider from "../ui-components/RangeSlider.svelte";

  export let skipToPercentage;
</script>

<div id="playback-settings">
  <div class="control">
    <span
      >Volume:
      <kbd class:depressed={$keyMap.VOLUME_DOWN.active}
        >{$keyMap.VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.VOLUME_UP.active}
        >{$keyMap.VOLUME_UP.key}</kbd
      >↑</span
    >
    <span>{$volumeCoefficient}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$volumeCoefficient}
      name="volume"
    />
  </div>
  <div class="control">
    <span
      >Bass Volume:
      <kbd class:depressed={$keyMap.BASS_VOLUME_DOWN.active}
        >{$keyMap.BASS_VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.BASS_VOLUME_UP.active}
        >{$keyMap.BASS_VOLUME_UP.key}</kbd
      >↑</span
    >
    <span>{$bassVolumeCoefficient}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$bassVolumeCoefficient}
      name="bass-volume"
    />
  </div>
  <div class="control">
    <span
      >Treble Volume:
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_DOWN.active}
        >{$keyMap.BASS_VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_UP.active}
        >{$keyMap.BASS_VOLUME_UP.key}</kbd
      >↑
    </span>
    <span>{$trebleVolumeCoefficient}</span>
    <RangeSlider
      min="0"
      max="4"
      step=".1"
      bind:value={$trebleVolumeCoefficient}
      name="treble-volume"
    />
  </div>
  <div class="control">
    <span
      >Tempo:
      <kbd class:depressed={$keyMap.TEMPO_DOWN.active}
        >{$keyMap.TEMPO_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.TEMPO_UP.active}>{$keyMap.TEMPO_UP.key}</kbd
      >↑</span
    >
    <span>{($tempoCoefficient * 100).toFixed(0)}%</span>
    <RangeSlider
      min="0.1"
      max="3"
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

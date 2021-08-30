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
  import { controlsConfig } from "../controls-config";
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
      min={controlsConfig.volume.min}
      max={controlsConfig.volume.max}
      step={controlsConfig.volume.delta}
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
      min={controlsConfig.bassVolume.min}
      max={controlsConfig.bassVolume.max}
      step={controlsConfig.bassVolume.delta}
      bind:value={$bassVolumeCoefficient}
      name="bass-volume"
    />
  </div>
  <div class="control">
    <span
      >Treble Volume:
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_DOWN.active}
        >{$keyMap.TREBLE_VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_UP.active}
        >{$keyMap.TREBLE_VOLUME_UP.key}</kbd
      >↑
    </span>
    <span>{$trebleVolumeCoefficient}</span>
    <RangeSlider
      min={controlsConfig.trebleVolume.min}
      max={controlsConfig.trebleVolume.max}
      step={controlsConfig.trebleVolume.delta}
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
      min={controlsConfig.tempo.min}
      max={controlsConfig.tempo.max}
      step={controlsConfig.tempo.delta}
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

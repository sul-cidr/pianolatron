<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import {
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
  } from "../stores";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import SliderControl from "../ui-components/SliderControl.svelte";

  export let skipToPercentage;
</script>

<div id="playback-settings">
  <SliderControl
    bind:value={$volumeCoefficient}
    min={controlsConfig.volume.min}
    max={controlsConfig.volume.max}
    step={controlsConfig.volume.delta}
    name="volume"
  >
    <svelte:fragment slot="label">
      Volume:
      <kbd class:depressed={$keyMap.VOLUME_DOWN.active}
        >{$keyMap.VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.VOLUME_UP.active}
        >{$keyMap.VOLUME_UP.key}</kbd
      >↑
    </svelte:fragment>
  </SliderControl>
  <SliderControl
    bind:value={$trebleVolumeCoefficient}
    min={controlsConfig.trebleVolume.min}
    max={controlsConfig.trebleVolume.max}
    step={controlsConfig.trebleVolume.delta}
    name="treble-volume"
  >
    <svelte:fragment slot="label">
      Treble Volume:
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_DOWN.active}
        >{$keyMap.TREBLE_VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.TREBLE_VOLUME_UP.active}
        >{$keyMap.TREBLE_VOLUME_UP.key}</kbd
      >↑
    </svelte:fragment>
  </SliderControl>
  <SliderControl
    bind:value={$bassVolumeCoefficient}
    min={controlsConfig.bassVolume.min}
    max={controlsConfig.bassVolume.max}
    step={controlsConfig.bassVolume.delta}
    name="bass-volume"
  >
    <svelte:fragment slot="label">
      Bass Volume:
      <kbd class:depressed={$keyMap.BASS_VOLUME_DOWN.active}
        >{$keyMap.BASS_VOLUME_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.BASS_VOLUME_UP.active}
        >{$keyMap.BASS_VOLUME_UP.key}</kbd
      >↑
    </svelte:fragment>
  </SliderControl>
  <SliderControl
    bind:value={$tempoCoefficient}
    min={controlsConfig.tempo.min}
    max={controlsConfig.tempo.max}
    step={controlsConfig.tempo.delta}
    name="tempo"
  >
    <svelte:fragment slot="label">
      Tempo:
      <kbd class:depressed={$keyMap.TEMPO_DOWN.active}
        >{$keyMap.TEMPO_DOWN.key}</kbd
      >↓
      <kbd class:depressed={$keyMap.TEMPO_UP.active}>{$keyMap.TEMPO_UP.key}</kbd
      >↑
    </svelte:fragment>
  </SliderControl>
  <SliderControl
    value={$playbackProgress}
    min="0"
    max="1"
    step="0.001"
    name="progress"
    on:input={({ target: { value } }) => skipToPercentage(value)}
    mousewheel={false}
  >
    <svelte:fragment slot="label">Progress:</svelte:fragment>
    <svelte:fragment slot="value"
      >{($playbackProgress * 100).toFixed(2)}%</svelte:fragment
    >
  </SliderControl>
</div>

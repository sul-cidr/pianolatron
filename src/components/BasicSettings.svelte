<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import {
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    transposeHalfStep,
  } from "../stores";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import SliderControl from "../ui-components/SliderControl.svelte";
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
    bind:value={$transposeHalfStep}
    min={controlsConfig.transpose.min}
    max={controlsConfig.transpose.max}
    step={controlsConfig.transpose.delta}
    name="transpose"
  >
    <svelte:fragment slot="label">Transpose (half steps):</svelte:fragment>
  </SliderControl>
</div>

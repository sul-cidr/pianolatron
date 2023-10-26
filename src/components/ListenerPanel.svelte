<style lang="scss">
  div {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow: hidden;
    position: relative;

    :global(> div) {
      @include background;
      display: flex;
      flex-direction: column;
      gap: 4%;
      height: 100%;
      left: 0;
      overflow-y: auto;
      position: absolute;
      top: 0;
      width: 100%;
    }

    :global(.setting + .setting) {
      margin-top: 1em;
    }

    :global(fieldset) {
      border-color: rgba(white, 0.8);
      padding: 1em 0.75em;
    }

    :global(legend) {
      font-family: $primary-typeface;
      font-size: 1.4em;
    }

    :global(fieldset div) {
      display: flex;
      justify-content: space-between;
    }
  }
</style>

<script>
  // This will probably change a lot as we make the listener panel look less utilitiarian. 
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import PlaybackControls from "./PlaybackControls.svelte";
  import {
    tempoCoefficient,
  } from "../stores";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import SliderControl from "../ui-components/SliderControl.svelte";


  export let playPauseApp;
  export let stopApp;
  const isPerform = false;

</script>

<div id="listener-panel">
  <div id="listener-playback-settings">
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
  </div>
</div>
<PlaybackControls {playPauseApp} {stopApp} {isPerform} />

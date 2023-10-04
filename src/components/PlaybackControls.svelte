<style lang="scss">
  #playback-controls {
    margin: 0 0.5em;
  }

  button {
    @include button;

    &.pedal-on {
      background-color: yellow;
      border-color: var(--primary-accent);
      color: var(--primary-accent);
    }

    kbd {
      margin: 0 -0.4em 0 0.4em;
    }
  }
</style>

<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import { softOnOff, sustainOnOff, accentOnOff } from "../stores";

  export let playPauseApp;
  export let stopApp;
  // Fewer controls for listener than performer
  export let isPerformer = true;
</script>

<div id="playback-controls">
  <button type="button" on:click={playPauseApp}
    >Play/Pause
    <kbd class:depressed={$keyMap.PLAY_PAUSE.active}
      >{$keyMap.PLAY_PAUSE.key}</kbd
    ></button
  >
  <button type="button" on:click={stopApp}
    >Rewind
    <kbd class:depressed={$keyMap.REWIND.active}>{$keyMap.REWIND.key}</kbd
    ></button
  >
  {#if isPerformer}
    <button
      type="button"
      class:pedal-on={$softOnOff}
      aria-pressed={$softOnOff}
      on:click={() => ($softOnOff = !$softOnOff)}
      >Soft
      <kbd class:depressed={$softOnOff}>{$keyMap.SOFT.key}</kbd>
    </button>
    <button
      type="button"
      class:pedal-on={$sustainOnOff}
      aria-pressed={$sustainOnOff}
      on:click={() => ($sustainOnOff = !$sustainOnOff)}
      >Sustain
      <kbd class:depressed={$sustainOnOff}>{$keyMap.SUSTAIN.key}</kbd>
    </button>
    <br />
    <button
      type="button"
      style="width:100%"
      class:pedal-on={$accentOnOff}
      aria-pressed={$accentOnOff}
      on:mousedown={() => ($accentOnOff = true)}
      >Accent
      <kbd class:depressed={$accentOnOff}>{$keyMap.ACCENT.key}</kbd>
    </button>
  {/if}
</div>
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

<style lang="scss">
  #playback-controls {
    margin: 0 0.5em;
  }

  button {
    display: inline-block;
    padding: 0.35em 0.8em;
    border: 0.1em solid #ffffff;
    margin: 0;
    border-radius: 0.25em;
    color: #ffffff;
    transition: all 0.2s;
    background-color: var(--primary-accent);

    &:hover,
    &.pedal-on {
      color: var(--primary-accent);
      border-color: var(--primary-accent);
      background-color: #ffffff;
    }

    &.pedal-on {
      background-color: yellow;
    }
  }
</style>

<script>
  import { softOnOff, sustain, accent } from "../stores";

  export let playPauseApp;
  export let stopApp;
</script>

<div id="playback-controls">
  <button type="button" on:click={playPauseApp}>Play/Pause</button>
  <button type="button" on:click={stopApp}>Stop</button>
  <button
    type="button"
    class:pedal-on={$softOnOff}
    aria-pressed={$softOnOff}
    on:click={() => ($softOnOff = !$softOnOff)}
  >Soft
    <kbd>q</kbd></button>
  <button
    type="button"
    class:pedal-on={$sustain}
    aria-pressed={$sustain}
    on:click={() => ($sustain = !$sustain)}
  >Sustain
    <kbd>c</kbd></button>
  <br />
  <button
    type="button"
    style="width:100%"
    class:pedal-on={$accent}
    aria-pressed={$accent}
    on:mousedown={() => ($accent = true)}
  >Accent
    <kbd>,</kbd></button>
</div>
<svelte:window on:mouseup={() => ($accent = false)} />

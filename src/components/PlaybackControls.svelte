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

    kbd {
      margin: 0 -0.4em 0 0.4em;
    }
  }
</style>

<script>
  import { softOnOff, sustainOnOff, accentOnOff } from "../stores";

  export let playPauseApp;
  export let stopApp;
</script>

<div id="playback-controls">
  <button type="button" on:click={playPauseApp}>Play/Pause</button>
  <button type="button" on:click={stopApp}>Rewind</button>
  <button
    type="button"
    class:pedal-on={$softOnOff}
    aria-pressed={$softOnOff}
    on:click={() => ($softOnOff = !$softOnOff)}
    >Soft
    <kbd class:depressed={$softOnOff}>q</kbd></button
  >
  <button
    type="button"
    class:pedal-on={$sustainOnOff}
    aria-pressed={$sustainOnOff}
    on:click={() => ($sustainOnOff = !$sustainOnOff)}
    >Sustain
    <kbd class:depressed={$sustainOnOff}>c</kbd></button
  >
  <br />
  <button
    type="button"
    style="width:100%"
    class:pedal-on={$accentOnOff}
    aria-pressed={$accentOnOff}
    on:mousedown={() => ($accentOnOff = true)}
    >Accent
    <kbd class:depressed={$accentOnOff}>,</kbd></button
  >
</div>
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

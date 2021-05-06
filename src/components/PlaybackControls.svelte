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
  import { pedalling } from "../stores";

  export let playPauseApp;
  export let stopApp;
</script>

<div id="playback-controls">
  <button type="button" on:click={playPauseApp}>Play/Pause</button>
  <button type="button" on:click={stopApp}>Stop</button>
  <button
    type="button"
    class:pedal-on={$pedalling.soft}
    aria-pressed={$pedalling.soft}
    on:click={() => pedalling.update((val) => ({ ...val, soft: !val.soft }))}
  >Soft</button>
  <button
    type="button"
    class:pedal-on={$pedalling.sustain}
    aria-pressed={$pedalling.sustain}
    on:click={() => pedalling.update((val) => ({
        ...val,
        sustain: !val.sustain,
      }))}
  >Sustain</button>
  <br />
  <button
    type="button"
    style="width:100%"
    class:pedal-on={$pedalling.accent}
    aria-pressed={$pedalling.accent}
    on:mousedown={() => pedalling.update((val) => ({ ...val, accent: true }))}
  >Accent</button>
</div>
<svelte:window
  on:mouseup={() => pedalling.update((val) => ({ ...val, accent: false }))}
/>

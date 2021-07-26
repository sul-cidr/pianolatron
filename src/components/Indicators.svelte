<style lang="scss">
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
  import { softOnOff, sustainOnOff } from "../stores";
</script>

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

<style lang="scss">
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
  import { softOnOff, sustainOnOff } from "../stores";
  import { keyMap } from "./KeyboardShortcuts.svelte";
</script>

<button
  type="button"
  class:pedal-on={$softOnOff}
  aria-pressed={$softOnOff}
  on:click={() => ($softOnOff = !$softOnOff)}
  >Soft
  <kbd class:depressed={$softOnOff}>{$keyMap.SOFT.key}</kbd></button
>
<button
  type="button"
  class:pedal-on={$sustainOnOff}
  aria-pressed={$sustainOnOff}
  on:click={() => ($sustainOnOff = !$sustainOnOff)}
  >Sustain
  <kbd class:depressed={$sustainOnOff}>{$keyMap.SUSTAIN.key}</kbd></button
>

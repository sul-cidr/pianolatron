<style lang="scss">
  #perform-controls {
    :global(kbd) {
      bottom: 0.35rem;
      position: absolute;
      right: 0rem;
    }

    :global(kbd:not(.depressed)) {
      opacity: 0.6;
    }

    font-family: SourceSans3, sans-serif;

    & .accent-button {
      background-color: var(--cardinal-red-light);
      border-color: var(--cardinal-red);
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin: 0 0 0.5rem;
      position: relative;
      cursor: pointer;
    }

    & .accent-button {
      background-color: var(--cool-grey);
      border-color: var(--cool-grey);
      border-style: solid;
      color: var(--white);
      height: 2rem;

      &.pedal-on {
        background-color: var(--cool-grey);
        border-color: yellow;
        color: yellow;
        font-weight: 500;
      }
    }

    & .half {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      justify-content: center;
      margin: 0 0 0.5rem;

      &.performer-accent-buttons {
        & button {
          background-color: var(--cool-grey);
          border-radius: 4px;
          border: 1px solid var(--cool-grey);
          color: var(--white);
          cursor: pointer;
          flex-grow: 1;
          height: 2rem;
          min-width: 120px;
          position: relative;
          width: 100%;

          &.pedal-on {
            background-color: var(--cool-grey);
            border-color: yellow;
            color: yellow;
            font-weight: 500;
          }
        }
      }
    }
  }
</style>

<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import { appMode, softOnOff, sustainOnOff, accentOnOff } from "../stores";
</script>

<div id="perform-controls">
  {#if $appMode === "perform"}
    <div class="performer-accent-buttons half">
      <button
        type="button"
        class:pedal-on={$softOnOff}
        aria-pressed={$softOnOff}
        on:click={() => ($softOnOff = !$softOnOff)}
        title="Soft pedal (key: {$keyMap.SOFT.key})"
        >Soft
        <kbd class:depressed={$softOnOff}>{$keyMap.SOFT.key}</kbd></button
      >
      <button
        type="button"
        class:pedal-on={$sustainOnOff}
        aria-pressed={$sustainOnOff}
        on:click={() => ($sustainOnOff = !$sustainOnOff)}
        title="Sustain pedal (key: {$keyMap.SUSTAIN.key})"
        >Sustain
        <kbd class:depressed={$sustainOnOff}>{$keyMap.SUSTAIN.key}</kbd></button
      >
    </div>
    <div class="performer-accent-buttons">
      <button
        type="button"
        style="width:100%"
        class:pedal-on={$accentOnOff}
        class="accent-button"
        aria-pressed={$accentOnOff}
        on:mousedown={() => ($accentOnOff = true)}
        title="Accent (key: {$keyMap.ACCENT.key})"
        >Accent
        <kbd class:depressed={$accentOnOff}>{$keyMap.ACCENT.key}</kbd></button
      >
    </div>
  {/if}
</div>
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

<style lang="scss">
  #perform-controls {
    font-family: SourceSans3, sans-serif;

    :global(kbd) {
      bottom: 0.35rem;
      position: absolute;
      right: 0rem;
    }

    button {
      align-items: center;
      background-color: var(--primary-accent);
      border: 1px solid var(--white);
      border-radius: 4px;
      color: var(--white);
      cursor: pointer;
      display: flex;
      height: 2rem;
      justify-content: center;
      position: relative;
      width: 100%;

      &:hover {
        background-color: var(--cardinal-red-light);
      }

      &:focus {
        outline: 4px solid white;
        outline-offset: -4px;
      }

      &.pedal-on {
        background-color: white;
        color: var(--primary-accent);
        border-color: var(--cardinal-red-light);
        font-weight: 500;
      }
    }

    & .half {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      justify-content: center;
      margin: 0 0 0.5rem;
    }
  }
</style>

<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import { appMode, softOnOff, sustainOnOff, accentOnOff } from "../stores";
  import { getShortcutKeyDesc } from "../config/keyboard-shortcut-config";
</script>

<div id="perform-controls">
  {#if $appMode === "perform"}
    <div class="performer-accent-buttons half">
      <button
        type="button"
        class:pedal-on={$softOnOff}
        aria-pressed={$softOnOff}
        aria-label="Soft pedal, shortcut key {getShortcutKeyDesc(
          $keyMap.SOFT.key,
        )}"
        on:click={() => ($softOnOff = !$softOnOff)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.code === "Space") e.stopPropagation();
        }}
        on:keyup={(e) => {
          if (e.key === "Enter" || e.code === "Space") e.stopPropagation();
        }}
        title="Soft pedal"
        >Soft
        <kbd class:depressed={$softOnOff}>{$keyMap.SOFT.key}</kbd></button
      >
      <button
        type="button"
        class:pedal-on={$sustainOnOff}
        aria-pressed={$sustainOnOff}
        aria-label="Sustain pedal, shortcut key {getShortcutKeyDesc(
          $keyMap.SUSTAIN.key,
        )}"
        on:click={() => ($sustainOnOff = !$sustainOnOff)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.code === "Space") e.stopPropagation();
        }}
        on:keyup={(e) => {
          if (e.key === "Enter" || e.code === "Space") e.stopPropagation();
        }}
        title="Sustain pedal"
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
        aria-label="Accent, shortcut key {getShortcutKeyDesc(
          $keyMap.ACCENT.key,
        )}"
        on:mousedown={() => ($accentOnOff = true)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.code === "Space") {
            $accentOnOff = true;
            e.stopPropagation();
          }
        }}
        on:keyup={(e) => {
          if (e.key === "Enter" || e.code === "Space") {
            $accentOnOff = false;
            e.stopPropagation();
          }
        }}
        title="Accent"
        >Accent
        <kbd class:depressed={$accentOnOff}>{$keyMap.ACCENT.key}</kbd></button
      >
    </div>
  {/if}
</div>
<svelte:window
  on:mouseup={() => ($accentOnOff = false)}
  on:keyup={(e) => {
    if (e.key === "Enter" || e.code === "Space") {
      $accentOnOff = false;
      e.stopPropagation();
    }
  }}
/>

<style lang="scss">
  #playback-controls {
    margin: 0 0.5em;
  }

  #playback-controls > div:first-child {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    display: flex;
    justify-content: space-around;
    padding: 8px;

    :global(.overlay) {
      position: relative;

      :global(kbd) {
        bottom: 0.35rem;
        opacity: 0.4;
        position: absolute;
        right: 0rem;
      }

      &:hover :global(kbd) {
        opacity: 1;
      }
    }
  }

  #playback-controls > div:last-child {
    display: flex;
    flex-wrap: wrap;

    button {
      @include button;
      flex-grow: 1;
      min-width: 120px;
      width: 50%;

      &.pedal-on {
        background-color: yellow;
        border-color: var(--primary-accent);
        color: var(--primary-accent);
      }

      kbd {
        margin: 0 -0.4em 0 0.4em;
      }
    }
  }
</style>

<script>
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import { isPlaying, softOnOff, sustainOnOff, accentOnOff } from "../stores";
  import IconButton from "../ui-components/IconButton.svelte";

  export let playPauseApp;
  export let stopApp;
</script>

<div id="playback-controls">
  <div>
    {#key $isPlaying}
      <IconButton
        class="overlay"
        disabled={false}
        on:click={playPauseApp}
        iconName={$isPlaying ? "pause" : "play"}
        label={$isPlaying ? "Pause" : "Play"}
        tooltip={$isPlaying ? "Pause (key: 7)" : "Play (key: 7)"}
        height="48"
        width="48"
      >
        <kbd class:depressed={$keyMap.PLAY_PAUSE.active}
          >{$keyMap.PLAY_PAUSE.key}</kbd
        >
      </IconButton>
    {/key}

    <IconButton
      class="overlay"
      disabled={false}
      on:click={stopApp}
      iconName="stop"
      label="Stop/Rewind"
      tooltip="Stop/Rewind (key: backspace)"
      height="48"
      width="48"
    >
      <kbd class:depressed={$keyMap.REWIND.active}>{$keyMap.REWIND.key}</kbd>
    </IconButton>
  </div>

  <div>
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
    <br />
    <button
      type="button"
      style="width:100%"
      class:pedal-on={$accentOnOff}
      aria-pressed={$accentOnOff}
      on:mousedown={() => ($accentOnOff = true)}
      >Accent
      <kbd class:depressed={$accentOnOff}>{$keyMap.ACCENT.key}</kbd></button
    >
  </div>
</div>
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

<style lang="scss">
  #playback-controls {
    margin: 0 0.5em;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    padding: 8px;

    :global(.overlay) {
      position: relative;

      :global(kbd) {
        position: absolute;
        bottom: 0.35rem;
        right: 0rem;
        opacity: 0.4;
      }

      &:hover :global(kbd) {
        opacity: 1;
      }
    }
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
  import { isPlaying, accentOnOff } from "../stores";
  import IconButton from "../ui-components/IconButton.svelte";

  export let playPauseApp;
  export let stopApp;

  $: console.log("isPlaying", $isPlaying);
</script>

<div id="playback-controls">
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
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

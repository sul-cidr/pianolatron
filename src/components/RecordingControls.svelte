<style lang="scss">
  #recording-controls {
    margin: 0 0.5em;
  }

  button {
    @include button;

    &.recording-on {
      background-color: yellow;
      border-color: var(--primary-accent);
      color: var(--primary-accent);
    }
  }
</style>

<script>
  import { recordingOnOff, recordingInBuffer } from "../stores";

  export let samplePlayer;
</script>

<div id="recording-controls">
  <div>Record MIDI</div>
  <button
    type="button"
    class:recording-on={$recordingOnOff}
    aria-pressed={$recordingOnOff}
    on:click={() => ($recordingOnOff = !$recordingOnOff)}
    >Start/Pause
  </button>
  {#if $recordingInBuffer}
    <button type="button" on:click={() => samplePlayer.midiRecording("clear")}
      >Clear
    </button>
    <button type="button" on:click={() => samplePlayer.midiRecording("export")}
      >Export
    </button>
  {/if}
</div>

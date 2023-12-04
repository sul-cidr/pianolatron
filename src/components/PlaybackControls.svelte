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

    &:hover :global(kbd) {
      opacity: 1;
    }

    font-family: SourceSans3, sans-serif;

    & .play-pause-button, .accent-button {
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
      & > div {
        border-radius: 4px;
        position: relative;
        flex: 1;
      }
      & .record-button {
        // if we have the ability to record, use this:
        // background-color: var(--cardinal-red-light);
        background-color: #ccc;
        border: 1px solid var(--cardinal-red-light);
      }
      & .start-over-button {
        background-color: var(--cool-grey);
        border: 1px solid var(--cool-grey);
      }
      & .skip-button {
        background-color: var(--black);
        border: 1px solid var(--black);
      }
    }
  }
</style>

<script>
  import { tick as sweep } from "svelte";
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import { 
    currentTick,
    isPlaying, 
    softOnOff, 
    sustainOnOff, 
    accentOnOff, } from "../stores";
  import IconButton from "../ui-components/IconButton.svelte";

  export let playPauseApp;
  export let stopApp;
  export let skipToTick;

  let isRecording = false;

  const toggleRecording = async () => {
    isRecording = !isRecording;
  };

  const skipFromCurrent = (tickIncrement = 1500) => {
    skipToTick($currentTick + tickIncrement);
  };

  const togglePlayPause = async () => {
    playPauseApp();
    await sweep();
  };

  // Fewer controls for listener than performer
  // Not entirely sure how this is supposed to work - commented out for now
  // export let isPerform = true;
</script>

<div id="perform-controls">
  <!-- {#if isPerform} -->
    <div class="play-pause-button">
      {#key $isPlaying}
        <IconButton
          class="overlay performer-button"
          disabled={false}
          height="48"
          width="48"
          on:click={togglePlayPause}
          iconName={$isPlaying ? "pause" : "play"}
          label={$isPlaying ? "Pause" : "Play"}
          tooltip={$isPlaying ? `Pause (key: ${$keyMap.PLAY_PAUSE.key})` : `Play (key: ${$keyMap.PLAY_PAUSE.key})`}
        >
          <kbd class:depressed={$keyMap.PLAY_PAUSE.active}
            >{$keyMap.PLAY_PAUSE.key}</kbd
          >
        </IconButton>
      {/key}
    </div>
    <div class="half">
      <div class="record-button">
        <IconButton
          class={isRecording
            ? "overlay performer-button"
            : "performer-button"}
          disabled={true}
          on:mousedown={toggleRecording}
          iconName="record"
          label="Record"
          height="24"
          title="Record"
          tooltip="Record (TBD)"
        />
      </div>
      <div class="start-over-button">
        <IconButton
          class="overlay performer-button"
          disabled={false}
          on:click={stopApp}
          iconName="rewind"
          label="Rewind"
          tooltip="Rewind (key: {$keyMap.REWIND.key})"
          height="24"
        >
          <kbd class:depressed={$keyMap.REWIND.active}>{$keyMap.REWIND.key}</kbd>
        </IconButton>
      </div>
    </div>
    <div class="half">
      <div class="skip-back-button skip-button">
        <IconButton
          class={"overlay performer-button"}
          disabled={false}
          on:mousedown={() => {
            skipFromCurrent(-1500);
          }}
          iconName="skipBack"
          label="Skip Back"
          height="24"
          tooltip="Skip Back (key: {$keyMap.BACKWARD.key})"
        >
          <kbd class:depressed={$keyMap.BACKWARD.active}>{$keyMap.BACKWARD.key}</kbd>
        </IconButton>
      </div>
      <div class="skip-forward-button skip-button">
        <IconButton
          class={"overlay performer-button"}
          disabled={false}
          on:mousedown={() => skipFromCurrent()}
          iconName="skipForward"
          label="Skip Ahead"
          height="24"
          tooltip="Skip Ahead (key: {$keyMap.FORWARD.key})"
        >
          <kbd class:depressed={$keyMap.FORWARD.active}>{$keyMap.FORWARD.key}</kbd>
        </IconButton>
      </div>
    </div>
    <div class="performer-accent-buttons half">
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
      </div>

    <div class="performer-accent-buttons">
      <button
        type="button"
        style="width:100%"
        class:pedal-on={$accentOnOff}
        class="accent-button"
        aria-pressed={$accentOnOff}
        on:mousedown={() => ($accentOnOff = true)}
        >Accent
        <kbd class:depressed={$accentOnOff}>{$keyMap.ACCENT.key}</kbd></button
      >
    </div>
  <!-- {/if} -->
</div>
<svelte:window on:mouseup={() => ($accentOnOff = false)} />

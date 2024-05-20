<style>
  .controls-container {
    display: flex;
    justify-content: center;
    background-color: var(--background-color);
  }

  .mode-switch-container {
    padding: 2px;
    text-align: center;
    position: absolute;
    left: 0;
  }

  .player-button-container {
    padding: 2px;
    text-align: center;
  }
</style>

<script>
  import { tick as sweep } from "svelte";
  import IconButton from "../ui-components/IconButton.svelte";
  import { keyMap } from "./KeyboardShortcuts.svelte";
  import {
    appMode,
    currentTick,
    isPlaying,
    playRepeat,
    playbackProgress,
    playbackProgressEnd,
    playbackProgressStart,
    recordingOnOff,
    recordingInBuffer,
    rollMetadata,
  } from "../stores";

  export let skipToTick;
  export let resetPlayback;
  export let playPauseApp;
  export let toggleRecording;

  let isBookmarked = false;
  const bookmark = () => {
    const urlToCopy = new URL(window.location);
    const params = Object.fromEntries(new URLSearchParams(urlToCopy.search));
    delete params.start;
    delete params.end;

    if ($playbackProgressStart >= 0) {
      params.start = ($playbackProgressStart * 100).toFixed(2);
    }
    if ($playbackProgressEnd < 1) {
      params.end = ($playbackProgressEnd * 100).toFixed(2);
    }
    urlToCopy.search = new URLSearchParams(params);
    window.navigator.clipboard.writeText(urlToCopy.toString());
    isBookmarked = true;

    setTimeout(() => {
      isBookmarked = false;
    }, 1000);
  };

  const togglePlayPause = async () => {
    playPauseApp();
    await sweep();
  };

  const skipFromCurrent = (tickIncrement = 1500) => {
    skipToTick($currentTick + tickIncrement);
  };

  let startMarked;
  let endMarked;
  // mark if no mark, remove if marked.
  const markStart = () => {
    if (startMarked) {
      playbackProgressStart.reset();
    } else {
      playbackProgressStart.set($playbackProgress);
      // if the start is bigger than the end, delete the end
      if ($playbackProgress > $playbackProgressEnd) {
        playbackProgressEnd.reset();
      }
    }
  };
  const markEnd = () => {
    if (endMarked) {
      playbackProgressEnd.reset();
    } else {
      playbackProgressEnd.set($playbackProgress);
      // if the end is less than the start, delete the start.
      if ($playbackProgress < $playbackProgressStart) {
        playbackProgressStart.reset();
      }
    }
  };

  const togglePlayRepeat = () => playRepeat.set(!$playRepeat);

  $: startMarked = $playbackProgressStart >= 0;
  $: endMarked = $playbackProgressEnd < 1;
</script>

<div class="controls-container">
  <div class="mode-switch-container">
    {#if $appMode === "perform"}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:mousedown={window.location.replace(`/?druid=${$rollMetadata.DRUID}`)}
        iconName="note"
        label="Reload in listen mode"
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:mousedown={window.location.replace(
          `/perform/?druid=${$rollMetadata.DRUID}`,
        )}
        iconName="piano"
        label="Reload in perform mode"
        height="32"
        width="32"
      />
    {/if}
  </div>

  <div class="player-button-container">
    {#if !isBookmarked}
      <IconButton
        class="player-button"
        disabled={false}
        on:mousedown={bookmark}
        iconName="bookmark"
        label="Bookmark"
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class="player-button"
        disabled={false}
        iconName="check"
        label="Bookmark Copied!"
        height="32"
        width="32"
      />
    {/if}
    <IconButton
      class={$playRepeat ? "enabled player-button" : "player-button"}
      disabled={false}
      on:mousedown={togglePlayRepeat}
      iconName="replay"
      label="Repeat"
      height="32"
      width="32"
    />
    <IconButton
      class={"player-button"}
      disabled={false}
      on:mousedown={resetPlayback}
      iconName="rewind"
      label="Rewind ({$keyMap.REWIND.key})"
      height="32"
      width="32"
    />
    <IconButton
      class={"player-button"}
      disabled={false}
      on:mousedown={() => {
        skipFromCurrent(-1500);
      }}
      iconName="skipBack"
      label="Skip Back ({$keyMap.BACKWARD.key})"
      height="32"
      width="32"
    />
    {#if !$isPlaying}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:mousedown={togglePlayPause}
        iconName="playback"
        label="Play ({$keyMap.PLAY_PAUSE.key})"
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class={"pause player-button"}
        disabled={false}
        on:mousedown={togglePlayPause}
        iconName="pause"
        label="Pause ({$keyMap.PLAY_PAUSE.key})"
        height="32"
        width="32"
      />
    {/if}
    {#if $appMode === "perform"}
      {#if !$recordingOnOff}
        {#if $recordingInBuffer}
          <IconButton
            class="player-button continue-record"
            disabled={false}
            on:mousedown={toggleRecording}
            iconName="continueRecording"
            label="Continue Recording ({$keyMap.TOGGLE_RECORD.key})"
            height="32"
            width="32"
            title="Continue Recording ({$keyMap.TOGGLE_RECORD.key})"
          />
        {:else}
          <IconButton
            class="player-button record"
            disabled={false}
            on:mousedown={toggleRecording}
            iconName="record"
            label="Record ({$keyMap.TOGGLE_RECORD.key})"
            height="32"
            width="32"
            title="Record ({$keyMap.TOGGLE_RECORD.key})"
          />
        {/if}
      {:else}
        <IconButton
          class="player-button pause-record"
          disabled={false}
          on:mousedown={toggleRecording}
          iconName="recordingActive"
          label="Pause Recording ({$keyMap.TOGGLE_RECORD.key})"
          height="32"
          width="32"
          title="Pause Recording ({$keyMap.TOGGLE_RECORD.key})"
        />
      {/if}
    {/if}
    <IconButton
      class={"player-button"}
      disabled={false}
      on:mousedown={() => skipFromCurrent()}
      iconName="skipForward"
      label="Skip Ahead ({$keyMap.FORWARD.key})"
      height="32"
      width="32"
    />
    <IconButton
      class={startMarked ? "enabled player-button" : "player-button"}
      disabled={false}
      on:mousedown={markStart}
      iconName="markStart"
      label={startMarked ? "Remove Start Mark" : "Mark Start"}
      height="32"
      width="32"
    />
    <IconButton
      class={endMarked ? "enabled player-button" : "player-button"}
      disabled={false}
      on:mousedown={markEnd}
      iconName="markEnd"
      label={endMarked ? "Remove End Mark" : "Mark End"}
      height="32"
      width="32"
    />
  </div>
</div>

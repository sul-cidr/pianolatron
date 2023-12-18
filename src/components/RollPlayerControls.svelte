<style>
  .player-button-container {
    padding: 2px;
    text-align: center;
  }
</style>

<script>
  import { tick as sweep } from "svelte";
  import IconButton from "../ui-components/IconButton.svelte";
  import {
    currentTick,
    isPlaying,
    playRepeat,
    playbackProgress,
    playbackProgressEnd,
    playbackProgressStart,
  } from "../stores";

  export let skipToTick;
  export let resetPlayback;
  export let playPauseApp;

  let isRecording = false;

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
    setTimeout(function () {
      isBookmarked = false;
    }, 1000);
  };

  const toggleRecording = async () => {
    console.log("TBD");
    isRecording = !isRecording;
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
    }
  };
  const markEnd = () => {
    if (endMarked) {
      playbackProgressEnd.reset();
    } else {
      playbackProgressEnd.set($playbackProgress);
    }
  };

  const togglePlayRepeat = () => playRepeat.set(!$playRepeat);

  $: startMarked = $playbackProgressStart >= 0;
  $: endMarked = $playbackProgressEnd < 1;
</script>

<div class="player-button-container">
  {#if !isBookmarked}
    <IconButton
      class="player-button"
      disabled={false}
      on:mousedown={bookmark}
      iconName="bookmark"
      label="bookmark"
      height="24"
      width="24"
    />
  {:else}
    <IconButton
      class="player-button"
      disabled={false}
      iconName="check"
      label="Bookmark Copied!"
      height="24"
      width="24"
    />
  {/if}
  <IconButton
    class={$playRepeat ? "enabled player-button" : "player-button"}
    disabled={false}
    on:mousedown={togglePlayRepeat}
    iconName="replay"
    label="Repeat"
    height="24"
    width="24"
  />
  <IconButton
    class={"player-button"}
    disabled={false}
    on:mousedown={resetPlayback}
    iconName="rewind"
    label="Rewind"
    height="24"
    width="24"
  />
  <IconButton
    class={"player-button"}
    disabled={false}
    on:mousedown={() => {
      skipFromCurrent(-1500);
    }}
    iconName="skipBack"
    label="Skip Back"
    height="24"
    width="24"
  />
  {#if !$isPlaying}
    <IconButton
      class={"player-button"}
      disabled={false}
      on:mousedown={togglePlayPause}
      iconName="play"
      label="Play"
      height="24"
      width="24"
    />
  {:else}
    <IconButton
      class={"pause player-button"}
      disabled={false}
      on:mousedown={togglePlayPause}
      iconName="pause"
      label="Pause"
      height="24"
      width="24"
    />
  {/if}
  <IconButton
    class={isRecording
      ? "overlay player-button record"
      : "player-button record"}
    disabled={false}
    on:mousedown={toggleRecording}
    iconName="record"
    label="Record"
    height="24"
    width="24"
    title="Record"
  />
  <IconButton
    class={"player-button"}
    disabled={false}
    on:mousedown={() => skipFromCurrent()}
    iconName="skipForward"
    label="Skip Ahead"
    height="24"
    width="24"
  />
  <IconButton
    class={startMarked ? "enabled player-button" : "player-button"}
    disabled={false}
    on:mousedown={markStart}
    iconName="markStart"
    label={startMarked ? "Remove Start Mark" : "Mark Start"}
    height="24"
    width="24"
  />
  <IconButton
    class={endMarked ? "enabled player-button" : "player-button"}
    disabled={false}
    on:mousedown={markEnd}
    iconName="markEnd"
    label={endMarked ? "Remove End Mark" : "Mark End"}
    height="24"
    width="24"
  />
</div>

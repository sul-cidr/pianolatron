<style>
  .controls-container {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }

  .mode-switch-container {
    padding: 2px;
  }

  .tempo-control-container {
    position: relative;
    padding: 2px;
    right: 2px;
    top: 2px;
    width: 200px;
    height: 50px;
    border: 2px solid rgba(0, 0, 0, 0.6);
    border-radius: 0.25em;
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
    tempoCoefficient,
    rollBeingBookmarked,
  } from "../stores";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import SliderControl from "../ui-components/SliderControl.svelte";

  export let skipToTick;
  export let resetPlayback;
  export let playPauseApp;
  export let toggleRecording;
  export let bookmarkRoll;

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
        on:click={window.location.replace(`/?druid=${$rollMetadata.DRUID}`)}
        iconName="listen"
        label="Reload in Listen Mode"
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:click={window.location.replace(
          `/perform/?druid=${$rollMetadata.DRUID}`,
        )}
        iconName="performMusic"
        label="Reload in Perform Mode"
        height="32"
        width="32"
      />
    {/if}
  </div>

  <div class="player-button-container">
    {#if !$rollBeingBookmarked}
      <IconButton
        class="player-button"
        disabled={false}
        on:click={bookmarkRoll}
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
      on:click={togglePlayRepeat}
      iconName="replay"
      label="Repeat"
      height="32"
      width="32"
    />
    <IconButton
      class={"player-button"}
      disabled={false}
      on:click={resetPlayback}
      iconName="rewind"
      label="Rewind"
      height="32"
      width="32"
    />
    <IconButton
      class={"player-button"}
      disabled={false}
      on:click={() => {
        skipFromCurrent(-1500);
      }}
      iconName="skipBack"
      label="Skip Back"
      height="32"
      width="32"
    />
    {#if !$isPlaying}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:click={togglePlayPause}
        iconName="playback"
        label="Play"
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class={"pause player-button"}
        disabled={false}
        on:click={togglePlayPause}
        iconName="pause"
        label="Pause"
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
            on:click={toggleRecording}
            iconName="continueRecording"
            label="Continue Recording"
            height="32"
            width="32"
            title="Continue Recording"
          />
        {:else}
          <IconButton
            class="player-button record"
            disabled={false}
            on:click={toggleRecording}
            iconName="record"
            label="Record"
            height="32"
            width="32"
            title="Record"
          />
        {/if}
      {:else}
        <IconButton
          class="player-button pause-record"
          disabled={false}
          on:click={toggleRecording}
          iconName="recordingActive"
          label="Pause Recording"
          height="32"
          width="32"
          title="Pause Recording"
        />
      {/if}
    {/if}
    <IconButton
      class={"player-button"}
      disabled={false}
      on:click={() => skipFromCurrent()}
      iconName="skipForward"
      label="Skip Ahead"
      height="32"
      width="32"
    />
    <IconButton
      class={startMarked ? "enabled player-button" : "player-button"}
      disabled={false}
      on:click={markStart}
      iconName="markStart"
      label={startMarked ? "Remove Start Mark" : "Mark Start"}
      height="32"
      width="32"
    />
    <IconButton
      class={endMarked ? "enabled player-button" : "player-button"}
      disabled={false}
      on:click={markEnd}
      iconName="markEnd"
      label={endMarked ? "Remove End Mark" : "Mark End"}
      height="32"
      width="32"
    />
  </div>
  {#if $appMode === "listen"}
    <div class="tempo-control-container">
      <SliderControl
        bind:value={$tempoCoefficient}
        min={controlsConfig.tempo.min}
        max={controlsConfig.tempo.max}
        step={controlsConfig.tempo.delta}
        name="tempo"
      >
        <svelte:fragment slot="label">Tempo:</svelte:fragment>
      </SliderControl>
    </div>
  {:else}
    <div />
  {/if}
</div>

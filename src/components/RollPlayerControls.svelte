<style lang="scss">
  .controls-container {
    display: flex;
    width: 100%;
    justify-content: space-between;

    &:hover {
      .header-show-hide-button {
        opacity: 1;
      }
    }
  }

  .mode-switch-container {
    padding: 2px;
  }

  .right-side-buttons {
    display: flex;
    gap: 5px;
  }

  .header-show-hide-button {
    position: relative;
    padding: 0;
    height: fit-content;
    border-radius: 0 0 4px 4px;
    background: rgba(0, 0, 0, 0.4);

    &:not(.hidden) {
      bottom: 0;
      opacity: 0;
    }

    &.hidden {
      visibility: visible;
    }

    &:hover,
    &:focus-within {
      opacity: 1;
    }
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
    userSettings,
  } from "../stores";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import SliderControl from "../ui-components/SliderControl.svelte";

  export let skipToTick;
  export let resetPlayback;
  export let playPauseApp;
  export let toggleRecording;
  export let bookmarkRoll;

  let headerIconName = `panel-top-${$userSettings.headerHidden ? "open" : "collapse"}`;

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

  const toggleHeader = () => {
    $userSettings.headerHidden = !$userSettings.headerHidden;
    headerIconName = `panel-top-${$userSettings.headerHidden ? "open" : "collapse"}`;
  };

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
      label={`Rewind${$appMode === "perform" ? ` (${$keyMap.REWIND.key})` : ""}`}
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
      label={`Skip Back${$appMode === "perform" ? ` (${$keyMap.BACKWARD.key})` : ""}`}
      height="32"
      width="32"
    />
    {#if !$isPlaying}
      <IconButton
        class={"player-button"}
        disabled={false}
        on:click={togglePlayPause}
        iconName="playback"
        label={`Play${$appMode === "perform" ? ` (${$keyMap.PLAY_PAUSE.key})` : ""}`}
        height="32"
        width="32"
      />
    {:else}
      <IconButton
        class={"pause player-button"}
        disabled={false}
        on:click={togglePlayPause}
        iconName="pause"
        label={`Pause${$appMode === "perform" ? ` (${$keyMap.PLAY_PAUSE.key})` : ""}`}
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
            label={`Continue Recording${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
            height="32"
            width="32"
            title={`Continue Recording${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
          />
        {:else}
          <IconButton
            class="player-button record"
            disabled={false}
            on:click={toggleRecording}
            iconName="record"
            label={`Record${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
            height="32"
            width="32"
            title={`Record${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
          />
        {/if}
      {:else}
        <IconButton
          class="player-button pause-record"
          disabled={false}
          on:click={toggleRecording}
          iconName="recordingActive"
          label={`Pause Recording${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
          height="32"
          width="32"
          title={`Pause Recording${$appMode === "perform" ? ` (${$keyMap.TOGGLE_RECORD.key})` : ""}`}
        />
      {/if}
    {/if}
    <IconButton
      class={"player-button"}
      disabled={false}
      on:click={() => skipFromCurrent()}
      iconName="skipForward"
      label={`Skip Ahead${$appMode === "perform" ? ` (${$keyMap.FORWARD.key})` : ""}`}
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
  <div class="right-side-buttons">
    <div class="header-show-hide-button">
      {#key headerIconName}
        <IconButton
          class="always-visible"
          on:click={toggleHeader}
          iconName={headerIconName}
          expanded={!$userSettings.headerHidden}
          label={`${$userSettings.headerHidden ? "Show" : "Hide"} Page Header`}
          height="32"
          width="32"
        />
      {/key}
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
    {/if}
  </div>
</div>

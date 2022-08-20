<style lang="scss">
  .setting {
    margin: 1em 0;
  }

  .list-header {
    font-family: $primary-typeface;
    font-size: 0.9em;
    margin-top: 1em;
    text-transform: uppercase;
    color: rgba(black, 0.6);
    display: inline-block;
    width: 100%;

    &::first-letter {
      font-size: 1.3em;
    }
  }

  ul {
    margin: 0.5em 0 0 1em;
    padding: 0;

    list-style-type: none;
  }

  li {
    padding: 0.25em 0;
  }

  #recording-controls {
    margin: 0 0.5em;
    flex-wrap: wrap;
    flex-direction: column;
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
  import { fade } from "svelte/transition";
  import {
    midiInputs,
    midiOutputs,
    userSettings,
    sustainOnOff,
    softOnOff,
    sustainFromExternalMidi,
    softFromExternalMidi,
    recordingOnOff,
    recordingInBuffer,
    recordingDuration,
  } from "../stores";

  export let recordingControl;

  let recordingTime = "00:00.00";

  const resetPedals = () => {
    $sustainOnOff = false;
    $softOnOff = false;
  };

  const formatRecordingDuration = (durInMs) => {
    const minutes = Math.floor(durInMs / 60000)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor((durInMs - minutes * 60000) / 1000)
      .toString()
      .padStart(2, "0");
    const hundredths = Math.floor(
      (durInMs - minutes * 60000 - seconds * 1000) / 10,
    )
      .toString()
      .padStart(2, "0");

    recordingTime = `${minutes}:${seconds}:${hundredths}`;
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $sustainFromExternalMidi, resetPedals();
  $: $softFromExternalMidi, resetPedals();
  $: formatRecordingDuration($recordingDuration);
</script>

<div>
  {#if navigator.requestMIDIAccess}
    <fieldset>
      <legend>MIDI in/out available</legend>

      <p>
        Connect a digital piano or other MIDI device to send/receive keyboard
        and pedal events.
      </p>

      <div class="setting">
        Enable WebMIDI:
        <input type="checkbox" bind:checked={$userSettings.useWebMidi} />
      </div>

      {#if $userSettings.useWebMidi}
        <div class="setting" transition:fade>
          Sustain from External MIDI:
          <input type="checkbox" bind:checked={$sustainFromExternalMidi} />
        </div>
        <div class="setting" transition:fade>
          Soft from External MIDI:
          <input type="checkbox" bind:checked={$softFromExternalMidi} />
        </div>

        <p class="list-header" transition:fade>Connected Inputs:</p>
        <ul>
          {#each $midiInputs as input}
            <li transition:fade>{input.name} {input.manufacturer}</li>
          {/each}
        </ul>

        <p class="list-header" transition:fade>Connected Outputs:</p>
        <ul>
          {#each $midiOutputs as output}
            <li transition:fade>{output.name} {output.manufacturer}</li>
          {/each}
        </ul>
      {/if}
    </fieldset>
  {:else}
    <fieldset>
      <legend>MIDI in/out not available</legend>
      <p>
        This browser does not support connecting to a digital piano or other
        MIDI device.
      </p>
    </fieldset>
  {/if}
  <fieldset>
    <legend>Record an Audio File</legend>
    <div id="recording-controls">
      <button
        type="button"
        class:recording-on={$recordingOnOff}
        aria-pressed={$recordingOnOff}
        on:click={() => ($recordingOnOff = !$recordingOnOff)}
        >Start/Pause</button
      >
      {#if $recordingInBuffer && !$recordingOnOff}
        <br />
        <button type="button" on:click={() => recordingControl("clear")}
          >Clear
        </button>
        <button type="button" on:click={() => recordingControl("export")}
          >Export
        </button>
      {/if}
      <p>
        {recordingTime}
      </p>
    </div>
  </fieldset>
</div>

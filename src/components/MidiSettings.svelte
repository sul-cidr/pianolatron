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
</style>

<script>
  import { fade } from "svelte/transition";
  import { midiInputs, midiOutputs, userSettings } from "../stores";
</script>

<section>
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
</section>

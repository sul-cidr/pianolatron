<style lang="scss">
  .theme-selector button {
    height: 1.5em;
    width: 1.5em;
    border-radius: 1.5em;
    border: none;
    margin: 0 0.5em;
    cursor: pointer;

    &.active {
      outline: 1px solid var(--primary-accent);
      outline-offset: 4px;
    }

    &.cardinal {
      background: $cardinal;
    }

    &.blue {
      background: steelblue;
    }

    &.green {
      background: darkolivegreen;
    }

    &.grey {
      background: darkslategrey;
    }
  }

  .input-param {
    align-self: center;
    margin: 0 10px 0 0;
  }
  .input-value {
    max-width: 100px;
  }

  button.full-width {
    margin: 0;
    padding: 3px 0;
    width: 100%;
  }
</style>

<script>
  import {
    rollHasExpressions,
    playExpressionsOnOff,
    rollPedalingOnOff,
    useMidiTempoEventsOnOff,
    userSettings,
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
  } from "../stores";
  import { toggleKeybindingsConfig } from "./KeyboardShortcutEditor.svelte";
  import { notify } from "../ui-components/Notification.svelte";

  const themes = ["cardinal", "blue", "green", "grey"];

  $: document.documentElement.setAttribute("data-theme", $userSettings.theme);
</script>

<div id="settings-panel">
  <fieldset>
    <legend>Visualization Settings</legend>
    <div>
      Show Details for Active Notes:
      <input type="checkbox" bind:checked={$userSettings.activeNoteDetails} />
    </div>
    <div>
      Display Note Velocities:
      <input type="checkbox" bind:checked={$userSettings.showNoteVelocities} />
    </div>
    <div>
      Highlight Enabled Holes:
      <input
        type="checkbox"
        bind:checked={$userSettings.highlightEnabledHoles}
      />
    </div>
    <div>
      <label class="input-param" for="vis_delay">Vis. delay (ms)</label>
      <div>
        <input
          class="input-value"
          id={"vis_delay"}
          type="number"
          step="100"
          bind:value={$userSettings.visDelayInMS}
          on:keydown|capture={(event) => {
            event.stopPropagation();
            return /[0-9-]/.test(event.key) ? event : null;
          }}
        />
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Roll Emulation Settings</legend>
    <div>
      Play Expressions:
      <input
        type="checkbox"
        bind:checked={$playExpressionsOnOff}
        disabled={!$rollHasExpressions}
      />
    </div>
    <div>
      Use Roll Pedaling:
      <input
        type="checkbox"
        bind:checked={$rollPedalingOnOff}
        disabled={!$rollHasExpressions}
      />
    </div>
    <div>
      Emulate Roll Acceleration:
      <input type="checkbox" bind:checked={$useMidiTempoEventsOnOff} />
    </div>
  </fieldset>

  <div class="theme-selector">
    Theme:
    {#each themes as theme}
      <button
        class={theme}
        class:active={$userSettings.theme === theme}
        on:click={() =>
          userSettings.update((settings) => ({
            ...settings,
            theme,
          }))}
      />
    {/each}
  </div>
  <button class="full-width" on:click={toggleKeybindingsConfig}
    >Configure Key Bindings</button
  >
  <button
    class="full-width"
    on:click={() => {
      userSettings.reset();
      sampleVolumes.reset();
      sampleVelocities.reset();
      reverbWetDry.reset();
      notify({
        message: "Settings have been reset!",
        type: "success",
        timeout: 4000,
      });
    }}>Reset All Settings</button
  >
</div>

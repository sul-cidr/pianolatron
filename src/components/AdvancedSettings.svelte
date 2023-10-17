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
    <div class="setting">
      Show Details for Active Notes:
      <input type="checkbox" bind:checked={$userSettings.activeNoteDetails} />
    </div>
    <div class="setting">
      Display Note Velocities:
      <input type="checkbox" bind:checked={$userSettings.showNoteVelocities} />
    </div>
    <div class="setting">
      Highlight Enabled Holes:
      <input
        type="checkbox"
        bind:checked={$userSettings.highlightEnabledHoles}
      />
    </div>
    <div class="setting">
      Show Roll Viewer Scale Bar
      <input
        type="checkbox"
        bind:checked={$userSettings.showRuler}
      />
    </div>
  </fieldset>

  <fieldset>
    <legend>Roll Emulation Settings</legend>
    <div class="setting">
      Play Expressions:
      <input
        type="checkbox"
        bind:checked={$playExpressionsOnOff}
        disabled={!$rollHasExpressions}
      />
    </div>
    <div class="setting">
      Use Roll Pedaling:
      <input
        type="checkbox"
        bind:checked={$rollPedalingOnOff}
        disabled={!$rollHasExpressions}
      />
    </div>
    <div class="setting">
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

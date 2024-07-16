<style lang="scss">
  button {
    @include button;
  }

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

  dt {
    height: 1em;
    width: 1em;
    float: left;
    margin-right: 0.5em;
    border-radius: 4px;
    transition: background-color 0.25s ease;
    &.disabled {
      background-color: none !important;
    }
  }
  dl:not(.hole-color-legend) dd span {
    display: inline-block;
    text-align: right;
    width: 3ch;
    margin-right: 1ch;
  }
  dl.hole-color-legend {
    display: flex;
    flex-direction: column;
    margin-top: 0.5em;
    dt {
      margin: 0.25em 0;
      width: 100%;
    }
  }
</style>

<script>
  import { slide } from "svelte/transition";
  import {
    rollHasExpressions,
    playExpressionsOnOff,
    rollPedalingOnOff,
    useMidiTempoEventsOnOff,
    userSettings,
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    gameController,
    volumeSensitivity,
    tempoSensitivity,
  } from "../stores";
  import { toggleKeybindingsConfig } from "./KeyboardShortcutEditor.svelte";
  import { notify } from "../ui-components/Notification.svelte";
  import SliderControl from "../ui-components/SliderControl.svelte";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import {
    defaultHoleColor,
    pedalHoleColor,
    controlHoleColor,
    holeColorMap,
  } from "../lib/utils";
  import { tooltip } from "../lib/tooltip-action";

  const themes = ["cardinal", "blue", "green", "grey"];

  $: document.documentElement.setAttribute("data-theme", $userSettings.theme);
</script>

<div id="settings-panel">
  <fieldset>
    <legend>Visualization Settings</legend>
    <label>
      Show Details for Active Notes:
      <input type="checkbox" bind:checked={$userSettings.activeNoteDetails} />
    </label>
    <label>
      Display Note Velocities:
      <input type="checkbox" bind:checked={$userSettings.showNoteVelocities} />
    </label>
    <label>
      Highlight Enabled Holes:
      <input
        type="checkbox"
        bind:checked={$userSettings.highlightEnabledHoles}
      />
    </label>
    <label class="setting">
      Show Roll Viewer Scale Bar:
      <input type="checkbox" bind:checked={$userSettings.showRuler} />
    </label>
  </fieldset>

  <fieldset>
    <legend>Color Legend</legend>
    <dl>
      <dt
        style={$rollPedalingOnOff
          ? `background-color: hsl(${pedalHoleColor});`
          : ""}
        class:disabled={!$rollPedalingOnOff}
      />
      <dd>Pedal Holes</dd>
      <dt
        style={$playExpressionsOnOff
          ? `background-color: hsl(${controlHoleColor});`
          : ""}
        class:disabled={!$playExpressionsOnOff}
      />
      <dd>Control Holes</dd>
      {#if !$userSettings.showNoteVelocities && !$userSettings.highlightEnabledHoles}
        <dt
          style="background-color: hsl({defaultHoleColor});"
          transition:slide
        />
        <dd transition:slide>Note Holes</dd>
      {/if}
    </dl>
    {#if $userSettings.showNoteVelocities || $userSettings.highlightEnabledHoles}
      <dl class="hole-color-legend" transition:slide>
        <dd>Note Velocity (soft - loud)</dd>
        <dt
          style={`background: linear-gradient(90deg, ${holeColorMap
            .map(
              (hsl, i) =>
                `hsl(${hsl}) ${(i / (holeColorMap.length - 1)) * 100}%`,
            )
            .join(", ")})`}
        />
      </dl>
    {/if}
  </fieldset>

  <fieldset
    use:tooltip={$rollHasExpressions
      ? null
      : "No Expressions are available for this roll type"}
  >
    <legend>Roll Emulation Settings</legend>
    <label>
      Play Expressions:
      <input
        type="checkbox"
        checked={$rollHasExpressions && $playExpressionsOnOff}
        on:change={() => ($playExpressionsOnOff = !$playExpressionsOnOff)}
        disabled={!$rollHasExpressions}
      />
    </label>
    <label>
      Use Roll Pedaling:
      <input
        type="checkbox"
        checked={$rollHasExpressions && $rollPedalingOnOff}
        on:change={() => ($rollPedalingOnOff = !$rollPedalingOnOff)}
        disabled={!$rollHasExpressions}
      />
    </label>
    <label>
      Emulate Roll Acceleration:
      <input
        type="checkbox"
        checked={$rollHasExpressions && $useMidiTempoEventsOnOff}
        on:change={() => ($useMidiTempoEventsOnOff = !$useMidiTempoEventsOnOff)}
        disabled={!$rollHasExpressions}
      />
    </label>
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
  <button on:click={toggleKeybindingsConfig}>Configure Key Bindings</button>
  <button
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
  <fieldset>
    <legend>Game Controller</legend>

    {#if $gameController === undefined}
      <p>
        To use a gamepad device for tempo, volume and other controls, connect it
        to the computer and press a button on the device.
      </p>
    {:else}
      <p>
        {$gameController.id} Buttons: {$gameController.buttons.length} Axes: {$gameController
          .axes.length}
      </p>
      <br />
      <SliderControl
        bind:value={$volumeSensitivity}
        min={controlsConfig.volumeSensitivity.min}
        max={controlsConfig.volumeSensitivity.max}
        step={controlsConfig.volumeSensitivity.delta}
        name="volume-sensitivity"
      >
        <svelte:fragment slot="label">Volume Sensitivity:</svelte:fragment>
      </SliderControl>
      <SliderControl
        bind:value={$tempoSensitivity}
        min={controlsConfig.tempoSensitivity.min}
        max={controlsConfig.tempoSensitivity.max}
        step={controlsConfig.tempoSensitivity.delta}
        name="tempo-sensitivity"
      >
        <svelte:fragment slot="label">Tempo Sensitivity:</svelte:fragment>
      </SliderControl>
    {/if}
  </fieldset>
</div>

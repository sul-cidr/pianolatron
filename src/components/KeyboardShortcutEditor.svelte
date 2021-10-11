<style lang="scss">
  .shortcut-editor {
    background-color: var(--background-color);
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    left: 50%;
    max-height: 80%;
    padding: 1em;
    position: absolute;
    top: 42%;
    transform: translate(-50%, -50%);
    width: min(600px, 100vw);
    z-index: z($main-context, notifications);

    :global(.panel-switcher) {
      border-bottom: 1px solid rgba(0, 0, 0, 0.4);
    }

    :global(.panel-switcher label) {
      background-color: var(--primary-accent);
      border-bottom: 0;
      border-radius: 0.25em 0.25em 0 0;
      border-width: 1px;
      color: white;
      opacity: 0.8;
      padding-bottom: 4px;
    }

    :global(.panel-switcher label:last-child) {
      margin-right: 4px;
    }
    :global(.panel-switcher input:checked + label) {
      background-color: var(--background-color);
      color: black;
      transform: translateY(2px);
    }
  }

  header {
    display: flex;
    font-size: 1.4em;
    font-weight: bold;
    justify-content: space-between;
    margin-bottom: 0.5em;
    text-decoration: underline;
  }

  footer {
    display: flex;

    p {
      flex: 1;
      margin: 1em 0 0;
    }
  }

  p {
    margin-bottom: 1em;
  }

  .panels {
    display: flex;
    overflow: hidden;
    padding-top: 4px;
    position: relative;
  }

  dl {
    display: grid;
    flex: none;
    gap: 0 0.25em;
    grid-auto-rows: min-content;
    grid-template-columns: auto auto;
    justify-content: space-between;
    width: 100%;

    &:not(:first-child) {
      margin-left: -100%;
    }
  }

  :global(dd, dt) {
    display: flex;
    align-items: center;
    margin: 2px 0;
  }

  :global(hr) {
    border-color: rgba(255, 255, 255, 0.8);
    border-width: 0 0 1px 0;
    grid-column: 1 / 3;
    width: 80%;
  }

  p.error-message {
    color: red;
  }

  p.reset {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    margin: 0;
    padding: 0;

    :global(svg) {
      stroke: grey;
    }

    &:hover :global(svg) {
      stroke: black;
    }
  }

  dl,
  p.reset,
  p.error-message {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;

    &.shown {
      opacity: 1;
      pointer-events: all;
      overflow-y: auto;
    }
  }
</style>

<script context="module">
  import { writable } from "svelte/store";

  const showKeybindingsConfig = writable(false);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import { fade } from "svelte/transition";
  import PanelSwitcher from "./PanelSwitcher.svelte";
  import KeyboardShortcutEditorRow from "./KeyboardShortcutEditorRow.svelte";
  import KeyboardShortcutDeltaEditorRow from "./KeyboardShortcutDeltaEditorRow.svelte";
  import Icon from "../ui-components/Icon.svelte";
  import {
    defaultKeyMap,
    keyMapMeta,
    unusableKeys,
    alternativeIndicatorText,
    deltaControls,
  } from "../config/keyboard-shortcut-config";
  import { defaultControlsConfig } from "../config/controls-config";
  import { keyMap, controlsConfig } from "./KeyboardShortcuts.svelte";

  let errorMessage;
  let selectedPanel = "playback";

  const panels = {
    playback: {
      text: "Playback Controls",
      shortcuts: [
        "SOFT",
        "SUSTAIN",
        "ACCENT",
        "PLAY_PAUSE",
        "REWIND",
        "FORWARD",
        "BACKWARD",
      ],
    },
    volumeAndTempo: {
      text: "Volume & Tempo",
      shortcuts: [
        "VOLUME_UP",
        "VOLUME_DOWN",
        "VOLUME_DELTA",
        "VOLUME_AUGMENTED_DELTA",
        "---",
        "TREBLE_VOLUME_UP",
        "TREBLE_VOLUME_DOWN",
        "TREBLE_VOLUME_DELTA",
        "TREBLE_VOLUME_AUGMENTED_DELTA",
        "---",
        "BASS_VOLUME_UP",
        "BASS_VOLUME_DOWN",
        "BASS_VOLUME_DELTA",
        "BASS_VOLUME_AUGMENTED_DELTA",
        "---",
        "TEMPO_UP",
        "TEMPO_DOWN",
        "TEMPO_DELTA",
        "TEMPO_AUGMENTED_DELTA",
        "---",
        "LEFT_HAND_AUGMENT",
        "RIGHT_HAND_AUGMENT",
      ],
    },
  };

  panels.others = {
    text: "Others",
    shortcuts: Object.keys($keyMap).filter(
      (shortcut) =>
        !Array.prototype
          .concat(...Object.values(panels).map((p) => p.shortcuts))
          .includes(shortcut),
    ),
  };

  const updateKeyBinding = (shortcut, detail) => {
    errorMessage = undefined;

    if (
      Object.values($keyMap)
        .map(({ code }) => code)
        .includes(detail.code) &&
      detail.code !== $keyMap[shortcut].code
    ) {
      errorMessage = `The "${detail.key}" key is already assigned.`;
      return;
    }

    if (unusableKeys.includes(detail.code)) {
      errorMessage = `The "${detail.key}" key cannot be assigned.`;
      return;
    }

    $keyMap[shortcut].code = detail.code;
    $keyMap[shortcut].key = alternativeIndicatorText[detail.code] || detail.key;

    $keyMap[shortcut].isChanged = detail.key !== defaultKeyMap[shortcut].key;
  };

  const updateDelta = (shortcut, detail) => {
    const { control, deltaType } = deltaControls[shortcut];
    const delta = detail || defaultControlsConfig[control][deltaType];
    $controlsConfig[control][deltaType] = delta;

    // $controlsConfig[control] is a single object per control (e.g. volume),
    //  with .delta and .augmentedDelta keys.  To keep track of which of these
    //  has been modified from the default, .isChanged (if it exists) is an
    //  array of either or both of the strings "delta" and "augmentedDelta".

    // clear the .isChanged array for this deltaType
    $controlsConfig[control].isChanged = (
      $controlsConfig[control].isChanged || []
    ).filter((_deltaType) => _deltaType !== deltaType);

    // and then add it if the new value for this deltaType is different
    //  from the default value
    if (delta !== defaultControlsConfig[control][deltaType]) {
      $controlsConfig[control].isChanged = [
        ...$controlsConfig[control].isChanged,
        deltaType,
      ];
    }
  };

  const resetShortcuts = () => {
    errorMessage = undefined;
    $keyMap = JSON.parse(JSON.stringify(defaultKeyMap));
    $controlsConfig = JSON.parse(JSON.stringify(defaultControlsConfig));
  };
</script>

{#if $showKeybindingsConfig}
  <div class="shortcut-editor" transition:fade>
    <header>
      Keyboard Controls
      <button on:click={toggleKeybindingsConfig}>
        <Icon name="cross" height="24" width="24" />
      </button>
    </header>
    <p>Click the edit button to reassign a control button.</p>
    <PanelSwitcher bind:selectedPanel {panels} class="panel-switcher" />
    <div class="panels">
      {#each Object.keys(panels) as panel}
        <dl class:shown={selectedPanel === panel}>
          {#each panels[panel].shortcuts as shortcut}
            {#if shortcut in $keyMap}
              <KeyboardShortcutEditorRow
                shortcut={$keyMap[shortcut]}
                meta={keyMapMeta[shortcut]}
                on:update={({ detail }) => updateKeyBinding(shortcut, detail)}
                on:reset={() =>
                  updateKeyBinding(shortcut, defaultKeyMap[shortcut])}
              />
            {:else if shortcut in deltaControls}
              <KeyboardShortcutDeltaEditorRow
                controlConfigValue={$controlsConfig[
                  deltaControls[shortcut].control
                ][deltaControls[shortcut].deltaType]}
                meta={deltaControls[shortcut]}
                isChanged={$controlsConfig[
                  deltaControls[shortcut].control
                ].isChanged?.includes(deltaControls[shortcut].deltaType)}
                on:update={({ detail }) => updateDelta(shortcut, detail)}
                on:reset={() => updateDelta(shortcut)}
              />
            {:else if shortcut === "---"}
              <hr />
            {/if}
          {/each}
        </dl>
      {/each}
    </div>
    <footer>
      <p class="error-message" class:shown={errorMessage}>
        {errorMessage}
      </p>
      <p
        class="reset"
        class:shown={Object.values($keyMap).some(
          (shortcut) => shortcut.isChanged,
        ) ||
          Object.values($controlsConfig).some(
            (shortcut) => shortcut.isChanged?.length,
          )}
      >
        Reset to defaults: <button on:click={resetShortcuts}>
          <Icon name="reset" height="24" width="24" />
        </button>
      </p>
    </footer>
  </div>
{/if}
<svelte:window
  on:keydown={({ code }) => {
    if (code === "Escape" && $showKeybindingsConfig) toggleKeybindingsConfig();
  }}
/>

<style lang="scss">
  .shortcut-editor {
    background-color: var(--background-color);
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    left: 50%;
    max-height: 80%;
    max-width: 100vw;
    min-width: min(400px, 100vw);
    padding: 1em;
    position: absolute;
    top: 42%;
    transform: translate(-50%, -50%);
    width: 400px;
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

  p {
    margin-bottom: 1em;
  }

  p.error-message {
    border-radius: 5px;
    border: 1px solid red;
    color: red;
    padding: 0.25em;
  }

  dl {
    display: grid;
    gap: 0 0.25em;
    grid-auto-rows: min-content;
    grid-template-columns: auto auto;
    height: 400px;
    justify-content: space-between;
    overflow-x: hidden;
    overflow-y: auto;
    padding-top: 4px;
  }

  p.reset {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 1em 0;
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
</style>

<script context="module">
  import { writable } from "svelte/store";

  const showKeybindingsConfig = writable(false);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import { fade, slide } from "svelte/transition";
  import PanelSwitcher from "./PanelSwitcher.svelte";
  import KeyboardShortcutEditorRow from "./KeyboardShortcutEditorRow.svelte";
  import Icon from "../ui-components/Icon.svelte";
  import {
    defaultKeyMap,
    keyMapMeta,
    unusableKeys,
    alternativeIndicatorText,
  } from "../config/keyboard-shortcut-config";
  import { keyMap } from "./KeyboardShortcuts.svelte";

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
        "BASS_VOLUME_UP",
        "BASS_VOLUME_DOWN",
        "TREBLE_VOLUME_UP",
        "TREBLE_VOLUME_DOWN",
        "TEMPO_UP",
        "TEMPO_DOWN",
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

  const resetShortcuts = () => {
    errorMessage = undefined;
    $keyMap = JSON.parse(JSON.stringify(defaultKeyMap));
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
    {#if errorMessage}
      <p class="error-message" transition:slide>{errorMessage}</p>
    {/if}
    <PanelSwitcher bind:selectedPanel {panels} class="panel-switcher" />
    <dl>
      {#each panels[selectedPanel].shortcuts as shortcut}
        <KeyboardShortcutEditorRow
          shortcut={$keyMap[shortcut]}
          meta={keyMapMeta[shortcut]}
          on:update={({ detail }) => updateKeyBinding(shortcut, detail)}
          on:reset={() => updateKeyBinding(shortcut, defaultKeyMap[shortcut])}
        />
      {/each}
    </dl>
    {#if Object.values($keyMap).some((shortcut) => shortcut.isChanged)}
      <p class="reset" transition:slide>
        Reset to defaults: <button on:click={resetShortcuts}>
          <Icon name="reset" height="24" width="24" />
        </button>
      </p>
    {/if}
  </div>
{/if}
<svelte:window
  on:keydown={({ code }) => {
    if (code === "Escape" && $showKeybindingsConfig) toggleKeybindingsConfig();
  }}
/>

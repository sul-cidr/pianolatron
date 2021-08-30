<style lang="scss">
  div {
    background-color: var(--background-color);
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    left: 50%;
    max-height: 80%;
    max-width: 100%;
    min-width: 400px;
    padding: 1em;
    position: absolute;
    top: 42%;
    transform: translate(-50%, -50%);
    width: 400px;
    z-index: z($main-context, notifications);
    display: flex;
    flex-direction: column;
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
    grid-template-columns: auto auto;
    justify-content: space-between;
    gap: 0 0.25em;
    overflow-y: auto;
    overflow-x: hidden;
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
  // eslint-disable-next-line import/order
  import { createPersistedStore } from "../stores";
  import {
    defaultKeyMap,
    unusableKeys,
    alternativeIndicatorText,
  } from "../config/keyboard-shortcut-config";

  export const keyMap = createPersistedStore(
    "keyMap",
    JSON.parse(JSON.stringify(defaultKeyMap)),
  );

  const showKeybindingsConfig = writable(false);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import { get } from "svelte/store";
  import { fade, slide } from "svelte/transition";
  import KeyboardShortcutEditorRow from "./KeyboardShortcutEditorRow.svelte";
  import Icon from "../ui-components/Icon.svelte";
  import {
    scrollDownwards,
    softOnOff,
    sustainOnOff,
    accentOnOff,
  } from "../stores";
  import { controlsConfig } from "../config/controls-config";
  import { keyMapMeta } from "../config/keyboard-shortcut-config";
  import { clamp, easingInterval, enforcePrecision } from "../utils";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;
  let errorMessage;

  const updateStore = (
    // config object
    { store, min, max, delta, shiftDelta, ctrlDelta, precision },
    // event
    { shiftKey, ctrlKey },
    increment,
  ) => {
    const d =
      (increment ? 1 : -1) *
      ((shiftKey && shiftDelta) || (ctrlKey && ctrlDelta) || delta);

    store.set(enforcePrecision(clamp(get(store) + d, min, max), precision));
  };

  const increment = (...args) => updateStore(...args, /* increment = */ true);
  const decrement = (...args) => updateStore(...args, /* increment = */ false);

  const keydownRepeatAction = (fn, immediate = true) => {
    if (actionInterval) return;
    if (immediate) fn();
    actionInterval = easingInterval(fn);
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

  const keydownCommandMap = {
    SOFT: () => ($softOnOff = true),
    SUSTAIN: () => ($sustainOnOff = true),
    ACCENT: () => ($accentOnOff = true),

    VOLUME_UP: (event) => increment(controlsConfig.volume, event),
    VOLUME_DOWN: (event) => decrement(controlsConfig.volume, event),
    BASS_VOLUME_UP: (event) => increment(controlsConfig.bassVolume, event),
    BASS_VOLUME_DOWN: (event) => decrement(controlsConfig.bassVolume, event),
    TREBLE_VOLUME_UP: (event) => increment(controlsConfig.trebleVolume, event),
    TREBLE_VOLUME_DOWN: (event) =>
      decrement(controlsConfig.trebleVolume, event),
    TEMPO_UP: (event) => increment(controlsConfig.tempo, event),
    TEMPO_DOWN: (event) => decrement(controlsConfig.tempo, event),

    PLAY_PAUSE: playPauseApp,
    REWIND: stopApp,
    FORWARD: () =>
      keydownRepeatAction(() =>
        updateTickByViewportIncrement(/* up = */ !$scrollDownwards),
      ),
    BACKWARD: () =>
      keydownRepeatAction(() =>
        updateTickByViewportIncrement(/* up = */ $scrollDownwards),
      ),

    PAN_UP: () =>
      keydownRepeatAction(() => updateTickByViewportIncrement(/* up = */ true)),
    PAN_DOWN: () =>
      keydownRepeatAction(() =>
        updateTickByViewportIncrement(/* up = */ false),
      ),
  };

  const keyupCommandMap = {
    SOFT: () => ($softOnOff = false),
    SUSTAIN: () => ($sustainOnOff = false),
    ACCENT: () => ($accentOnOff = false),
  };
</script>

{#if $showKeybindingsConfig}
  <div transition:fade>
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
    <dl>
      {#each Object.keys($keyMap) as shortcut}
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
  on:keydown={(event) => {
    const cmd = Object.keys($keyMap).find(
      (key) => $keyMap[key].code === event.code,
    );

    if (cmd) {
      if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
      $keyMap[cmd].active = true;
      keydownCommandMap[cmd]?.(event);
      return;
    }

    if (event.code === "Escape" && $showKeybindingsConfig)
      toggleKeybindingsConfig();
  }}
  on:keyup={({ code }) => {
    const cmd = Object.keys($keyMap).find((key) => $keyMap[key].code === code);
    if (cmd) {
      actionInterval?.clear();
      actionInterval = undefined;
      $keyMap[cmd].active = false;
      keyupCommandMap[cmd]?.();
    }
  }}
/>

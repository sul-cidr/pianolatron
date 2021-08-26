<style lang="scss">
  div {
    @include background;
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    left: 50%;
    max-height: 100%;
    max-width: 100%;
    min-width: 400px;
    padding: 1em;
    position: absolute;
    top: 20%;
    transform: translate(-50%);
    width: 400px;
    z-index: z($main-context, notifications);
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

    svg {
      stroke: grey;
    }

    &:hover svg {
      stroke: black;
    }
  }
</style>

<script context="module">
  import { get, writable } from "svelte/store";

  const defaultKeyMap = {
    SOFT: {
      code: "KeyB",
      key: "b",
      description: "Soft Pedal",
      help: "Hold down to apply the soft pedal",
    },
    SUSTAIN: {
      code: "Space",
      key: "␣",
      description: "Sustain Pedal",
      help: "Hold down to apply the sustain pedal",
    },
    ACCENT: {
      code: "KeyN",
      key: "n",
      description: "Accent Button",
      help: "Hold down to apply a bump to the intensity",
    },

    VOLUME_UP: {
      code: "KeyO",
      key: "o",
      description: "Volume Up",
      help:
        "Increase the main volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    VOLUME_DOWN: {
      code: "KeyI",
      key: "i",
      description: "Volume Down",
      help:
        "Decrease the main volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    BASS_VOLUME_UP: {
      code: "Digit4",
      key: "4",
      description: "Bass Volume Up",
      help:
        "Increase the bass volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    BASS_VOLUME_DOWN: {
      code: "KeyE",
      key: "e",
      description: "Bass Volume Down",
      help:
        "Decrease the bass volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    TREBLE_VOLUME_UP: {
      code: "Digit0",
      key: "0",
      description: "Treble Volume Up",
      help:
        "Increase the treble volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    TREBLE_VOLUME_DOWN: {
      code: "KeyP",
      key: "p",
      description: "Treble Volume Down",
      help:
        "Decrease the treble volume (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },

    TEMPO_UP: {
      code: "KeyT",
      key: "t",
      description: "Tempo Up",
      help:
        "Increase the tempo (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },
    TEMPO_DOWN: {
      code: "KeyR",
      key: "r",
      description: "Tempo Down",
      help:
        "Decrease the tempo (use Shift for a larger increment, and Ctrl for finer-grained control)",
    },

    PLAY_PAUSE: {
      code: "Digit7",
      key: "7",
      description: "Play/Pause",
      help: "Play or pause the roll playback",
    },
    REWIND: {
      code: "Backspace",
      key: "←",
      description: "Rewind Roll",
      help: "Rewind the roll to the beginning of the holes",
    },
    FORWARD: {
      code: "Digit8",
      key: "8",
      description: "Move Roll Forwards",
      help: "Advance the roll forwards (hold down to accelerate)",
    },
    BACKWARD: {
      code: "Digit6",
      key: "6",
      description: "Move Roll Backwards",
      help: "Move the roll backwards (hold down to accelerate)",
    },
  };
  export const keyMap = writable(JSON.parse(JSON.stringify(defaultKeyMap)));

  const unusableKeys = [
    "Escape",
    "ControlLeft",
    "ControlRight",
    "Enter",
    "ShiftLeft",
    "ShiftRight",
  ];

  const showKeybindingsConfig = writable(false);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import { fade, slide } from "svelte/transition";
  import KeyboardShortcutEditorRow from "./KeyboardShortcutEditorRow.svelte";
  import {
    softOnOff,
    sustainOnOff,
    accentOnOff,
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
  } from "../stores";
  import { clamp, easingInterval, enforcePrecision } from "../utils";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;

  const config = {
    volume: {
      store: volumeCoefficient,
      min: 0,
      max: 4,
      delta: 0.1,
      shiftDelta: 0.4,
      ctrlDelta: 0.05,
      precision: 2,
    },
    bassVolume: {
      store: bassVolumeCoefficient,
      min: 0,
      max: 4,
      delta: 0.1,
      shiftDelta: 0.4,
      ctrlDelta: 0.05,
      precision: 2,
    },
    trebleVolume: {
      store: trebleVolumeCoefficient,
      min: 0,
      max: 4,
      delta: 0.1,
      shiftDelta: 0.4,
      ctrlDelta: 0.05,
      precision: 2,
    },
    tempo: {
      store: tempoCoefficient,
      min: 0.1,
      max: 4,
      delta: 0.05,
      shiftDelta: 0.1,
      ctrlDelta: 0.01,
      precision: 2,
    },
  };

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
      errorMessage = `Cancelled -- the "${detail.key}" key is already assigned!`;
      return;
    }

    if (unusableKeys.includes(detail.code)) {
      errorMessage = `Cancelled -- the "${detail.key}" key cannot be assigned!`;
      return;
    }

    $keyMap[shortcut].code = detail.code;
    $keyMap[shortcut].key = detail.key;

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

    VOLUME_UP: (event) => increment(config.volume, event),
    VOLUME_DOWN: (event) => decrement(config.volume, event),
    BASS_VOLUME_UP: (event) => increment(config.bassVolume, event),
    BASS_VOLUME_DOWN: (event) => decrement(config.bassVolume, event),
    TREBLE_VOLUME_UP: (event) => increment(config.trebleVolume, event),
    TREBLE_VOLUME_DOWN: (event) => decrement(config.trebleVolume, event),
    TEMPO_UP: (event) => increment(config.tempo, event),
    TEMPO_DOWN: (event) => decrement(config.tempo, event),

    PLAY_PAUSE: playPauseApp,
    REWIND: stopApp,
    FORWARD: () =>
      keydownRepeatAction(() => updateTickByViewportIncrement(/* up = */ true)),
    BACKWARD: () =>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg></button
      >
    </header>
    <p>Click the edit button to reassign a command's key.</p>
    {#if errorMessage}
      <p class="error-message" transition:slide>{errorMessage}</p>
    {/if}
    <dl>
      {#each Object.keys($keyMap) as shortcut}
        <KeyboardShortcutEditorRow
          shortcut={$keyMap[shortcut]}
          on:update={({ detail }) => updateKeyBinding(shortcut, detail)}
          on:reset={() => updateKeyBinding(shortcut, defaultKeyMap[shortcut])}
        />
      {/each}
    </dl>
    {#if Object.values($keyMap).some((shortcut) => shortcut.isChanged)}
      <p class="reset" transition:slide>
        Reset to defaults: <button on:click={resetShortcuts}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m 10.953,20.006141 a 8,8 0 1 1 4,-0.5 m 5,0.5 h -5 v -5" />
          </svg>
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

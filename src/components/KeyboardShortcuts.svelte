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
    font-size: 1.4em;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 0.5em;
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

  const showKeybindingsConfig = writable(true);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import { slide } from "svelte/transition";
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
</script>

{#if $showKeybindingsConfig}
  <div>
    <header>Keyboard Controls</header>
    <p>Click the edit button to reassign a command's key.</p>
    {#if errorMessage}
      <p class="error-message" transition:slide>{errorMessage}</p>
    {/if}
    <dl>
      {#each Object.keys($keyMap) as shortcut}
        <KeyboardShortcutEditorRow
          shortcut={$keyMap[shortcut]}
          on:update={({ detail }) => updateKeyBinding(shortcut, detail)}
          on:reset={() => ($keyMap[shortcut] = { ...defaultKeyMap[shortcut] })}
        />
      {/each}
    </dl>
  </div>
{/if}

<svelte:window
  on:keydown={(event) => {
    switch (event.code) {
      case $keyMap.SOFT.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        $softOnOff = true;
        break;

      case $keyMap.SUSTAIN.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        $sustainOnOff = true;
        break;

      case $keyMap.ACCENT.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        $accentOnOff = true;
        break;

      case keyMap.PLAY_PAUSE.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        keyMap.PLAY_PAUSE.active = true;
        playPauseApp();
        break;

      case keyMap.REWIND.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        keyMap.REWIND.active = true;
        stopApp();
        break;

      case keyMap.FORWARD.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        keydownRepeatAction(() =>
          updateTickByViewportIncrement(/* up = */ true),
        );
        break;

      case keyMap.BACKWARD.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        keydownRepeatAction(() =>
          updateTickByViewportIncrement(/* up = */ false),
        );
        break;

      case keyMap.VOLUME_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.VOLUME_UP.active = true;
        increment(config.volume, event);
        break;

      case keyMap.VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.VOLUME_DOWN.active = true;
        decrement(config.volume, event);
        break;

      case keyMap.BASS_VOLUME_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.BASS_VOLUME_UP.active = true;
        increment(config.bassVolume, event);
        break;

      case keyMap.BASS_VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.BASS_VOLUME_DOWN.active = true;
        decrement(config.bassVolume, event);
        break;

      case keyMap.TREBLE_VOLUME_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.TREBLE_VOLUME_UP.active = true;
        increment(config.trebleVolume, event);
        break;

      case keyMap.TREBLE_VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.TREBLE_VOLUME_DOWN.active = true;
        decrement(config.trebleVolume, event);
        break;

      case keyMap.TEMPO_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.TEMPO_UP.active = true;
        increment(config.tempo, event);
        break;

      case keyMap.TEMPO_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        keyMap.TEMPO_DOWN.active = true;
        decrement(config.tempo, event);
        break;

      // no default
    }
  }}
  on:keyup={({ code }) => {
    actionInterval?.clear();
    actionInterval = undefined;

    switch (code) {
      case $keyMap.SOFT.code:
        $softOnOff = false;
        break;

      case $keyMap.SUSTAIN.code:
        $sustainOnOff = false;
        break;

      case $keyMap.ACCENT.code:
        $accentOnOff = false;
        break;

      case keyMap.PLAY_PAUSE.code:
        keyMap.PLAY_PAUSE.active = false;
        break;

      case keyMap.REWIND.code:
        keyMap.REWIND.active = false;
        break;

      case keyMap.VOLUME_UP.code:
        keyMap.VOLUME_UP.active = false;
        break;

      case $keyMap.VOLUME_DOWN.code:
        $keyMap.VOLUME_DOWN.active = false;
        break;

      case keyMap.BASS_VOLUME_UP.code:
        keyMap.BASS_VOLUME_UP.active = false;
        break;

      case keyMap.BASS_VOLUME_DOWN.code:
        keyMap.BASS_VOLUME_DOWN.active = false;
        break;

      case keyMap.TREBLE_VOLUME_UP.code:
        keyMap.TREBLE_VOLUME_UP.active = false;
        break;

      case keyMap.TREBLE_VOLUME_DOWN.code:
        keyMap.TREBLE_VOLUME_DOWN.active = false;
        break;

      case keyMap.TEMPO_UP.code:
        keyMap.TEMPO_UP.active = false;
        break;

      case $keyMap.TEMPO_DOWN.code:
        $keyMap.TEMPO_DOWN.active = false;
        break;

      // no default
    }
  }}
/>

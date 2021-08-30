<script context="module">
  import { writable } from "svelte/store";
  // eslint-disable-next-line import/order
  import { createPersistedStore } from "../stores";
  import { defaultKeyMap } from "../config/keyboard-shortcut-config";

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
  import {
    scrollDownwards,
    softOnOff,
    sustainOnOff,
    accentOnOff,
  } from "../stores";
  import { controlsConfig } from "../config/controls-config";
  import { clamp, easingInterval, enforcePrecision } from "../utils";
  import KeyboardShortcutEditor from "./KeyboardShortcutEditor.svelte";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;

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

{#if $showKeybindingsConfig}<KeyboardShortcutEditor />{/if}

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

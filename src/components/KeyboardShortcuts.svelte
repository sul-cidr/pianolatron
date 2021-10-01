<script context="module">
  import { createPersistedStore } from "../lib/stores";
  import { defaultKeyMap } from "../config/keyboard-shortcut-config";
  import { controlsConfig as defaultControlsConfig } from "../config/controls-config";

  export const keyMap = createPersistedStore(
    "keyMap",
    JSON.parse(JSON.stringify(defaultKeyMap)),
  );

  export const controlsConfig = createPersistedStore("controlConfig", {
    ...defaultControlsConfig,
  });
</script>

<script>
  import { get } from "svelte/store";
  import {
    scrollDownwards,
    softOnOff,
    sustainOnOff,
    accentOnOff,
  } from "../stores";
  import { clamp, easingInterval, enforcePrecision } from "../lib/utils";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;
  let leftHandAugment = false;
  let rightHandAugment = false;

  const leftHandControls = ["tempo", "bassVolume"];
  const rightHandControls = ["trebleVolume", "volume"];

  const updateStore = (control, increment) => {
    const { store, min, max, delta, augmentedDelta, precision } =
      $controlsConfig[control];

    let d =
      (leftHandControls.includes(control) && leftHandAugment) ||
      (rightHandControls.includes(control) && rightHandAugment)
        ? augmentedDelta
        : delta;
    d *= increment ? 1 : -1;
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

    VOLUME_UP: () => increment("volume"),
    VOLUME_DOWN: () => decrement("volume"),
    BASS_VOLUME_UP: () => increment("bassVolume"),
    BASS_VOLUME_DOWN: () => decrement("bassVolume"),
    TREBLE_VOLUME_UP: () => increment("trebleVolume"),
    TREBLE_VOLUME_DOWN: () => decrement("trebleVolume"),
    TEMPO_UP: () => increment("tempo"),
    TEMPO_DOWN: () => decrement("tempo"),

    LEFT_HAND_AUGMENT: () => (leftHandAugment = true),
    RIGHT_HAND_AUGMENT: () => (rightHandAugment = true),

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

    LEFT_HAND_AUGMENT: () => (leftHandAugment = false),
    RIGHT_HAND_AUGMENT: () => (rightHandAugment = false),
  };
</script>

<svelte:window
  on:keydown={(event) => {
    const cmd = Object.keys($keyMap).find(
      (key) => $keyMap[key].code === event.code,
    );

    if (cmd) {
      if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
      $keyMap[cmd].active = true;
      keydownCommandMap[cmd]?.(event);
    }
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

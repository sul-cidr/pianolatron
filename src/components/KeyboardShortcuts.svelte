<script context="module">
  import { createPersistedStore } from "../lib/stores";
  import { defaultKeyMap } from "../config/keyboard-shortcut-config";

  export const keyMap = createPersistedStore(
    "keyMap",
    JSON.parse(JSON.stringify(defaultKeyMap)),
  );
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
  import { clamp, easingInterval, enforcePrecision } from "../lib/utils";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;

  const updateStore = ({ store, min, max, delta, precision }, increment) => {
    const d = (increment ? 1 : -1) * delta;
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

    VOLUME_UP: () => increment(controlsConfig.volume),
    VOLUME_DOWN: () => decrement(controlsConfig.volume),
    BASS_VOLUME_UP: () => increment(controlsConfig.bassVolume),
    BASS_VOLUME_DOWN: () => decrement(controlsConfig.bassVolume),
    TREBLE_VOLUME_UP: () => increment(controlsConfig.trebleVolume),
    TREBLE_VOLUME_DOWN: () => decrement(controlsConfig.trebleVolume),
    TEMPO_UP: () => increment(controlsConfig.tempo),
    TEMPO_DOWN: () => decrement(controlsConfig.tempo),

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

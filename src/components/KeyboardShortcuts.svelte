<script>
  import { get } from "svelte/store";
  import {
    softOnOff,
    sustainOnOff,
    accentOnOff,
    volumeCoefficient,
    tempoCoefficient,
    activeShortcutKeys,
  } from "../stores";
  import { clamp, enforcePrecision } from "../utils";

  const keyMap = Object.freeze({
    SOFT: "KeyQ",
    SUSTAIN: "KeyC",
    ACCENT: "Comma",
    VOLUME_UP: "BracketRight",
    VOLUME_DOWN: "BracketLeft",
    TEMPO_UP: "KeyE",
    TEMPO_DOWN: "KeyW",
  });

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

  const updateStore = (
    { store, min, max, delta, shiftDelta, ctrlDelta, precision },
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
</script>

<svelte:window
  on:keydown={(event) => {
    switch (event.code) {
      case keyMap.SOFT:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        softOnOff.set(true);
        break;

      case keyMap.SUSTAIN:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        sustainOnOff.set(true);
        break;

      case keyMap.ACCENT:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        accentOnOff.set(true);
        break;

      case keyMap.VOLUME_UP:
        event.preventDefault();
        $activeShortcutKeys.volumeUp = true;
        increment(config.volume, event);
        break;

      case keyMap.VOLUME_DOWN:
        event.preventDefault();
        $activeShortcutKeys.volumeDown = true;
        decrement(config.volume, event);
        break;

      case keyMap.TEMPO_UP:
        event.preventDefault();
        $activeShortcutKeys.tempoUp = true;
        increment(config.tempo, event);
        break;

      case keyMap.TEMPO_DOWN:
        event.preventDefault();
        $activeShortcutKeys.tempoDown = true;
        decrement(config.tempo, event);
        break;

      // no default
    }
  }}
  on:keyup={({ code }) => {
    switch (code) {
      case keyMap.SOFT:
        softOnOff.set(false);
        break;

      case keyMap.SUSTAIN:
        sustainOnOff.set(false);
        break;

      case keyMap.ACCENT:
        accentOnOff.set(false);
        break;

      case keyMap.VOLUME_UP:
        $activeShortcutKeys.volumeUp = false;
        break;

      case keyMap.VOLUME_DOWN:
        $activeShortcutKeys.volumeDown = false;
        break;

      case keyMap.TEMPO_UP:
        $activeShortcutKeys.tempoUp = false;
        break;

      case keyMap.TEMPO_DOWN:
        $activeShortcutKeys.tempoDown = false;
        break;

      // no default
    }
  }}
/>

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

  dl {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  dd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    svg {
      cursor: pointer;
      stroke: grey;

      &:hover {
        stroke: black;
      }
    }
  }
</style>

<script context="module">
  import { get, writable } from "svelte/store";

  const showKeybindingsConfig = writable(false);
  export const toggleKeybindingsConfig = () =>
    showKeybindingsConfig.update((val) => !val);
</script>

<script>
  import {
    softOnOff,
    sustainOnOff,
    accentOnOff,
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    activeShortcutKeys,
  } from "../stores";
  import { clamp, easingInterval, enforcePrecision } from "../utils";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;

  let actionInterval;

  const keyMap = {
    SOFT: { code: "KeyB", key: "b", description: "Soft Pedal" },
    SUSTAIN: { code: "Space", key: "␣", description: "Sustain Pedal" },
    ACCENT: { code: "KeyN", key: "n", description: "Accent Button" },

    VOLUME_UP: { code: "KeyO", key: "o", description: "Volume Up" },
    VOLUME_DOWN: { code: "KeyI", key: "i", description: "Volume Down" },
    BASS_VOLUME_UP: { code: "Digit4", key: "4", description: "Bass Volume Up" },
    BASS_VOLUME_DOWN: {
      code: "KeyE",
      key: "e",
      description: "Bass Volume Down",
    },
    TREBLE_VOLUME_UP: {
      code: "Digit0",
      key: "0",
      description: "Treble Volume Up",
    },
    TREBLE_VOLUME_DOWN: {
      code: "KeyP",
      key: "p",
      description: "Treble Volume Down",
    },

    TEMPO_UP: { code: "KeyT", key: "t", description: "Tempo Up" },
    TEMPO_DOWN: { code: "KeyR", key: "r", description: "Tempo Down" },

    PLAY_PAUSE: { code: "Digit7", key: "7", description: "Play/Pause" },
    REWIND: { code: "Backspace", key: "←", description: "Rewind Roll" },
    FORWARD: { code: "Digit8", key: "8", description: "Move Roll Forwards" },
    BACKWARD: { code: "Digit6", key: "6", description: "Move Roll Backwards" },
  };

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
</script>

<svg style="display: none">
  <symbol id="edit" viewBox="0 0 24 24">
    <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
    <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
    <line x1="16" y1="5" x2="19" y2="8" />
  </symbol>
</svg>

{#if $showKeybindingsConfig}
  <div>
    <dl>
      {#each Object.keys(keyMap) as func}
        <dt>{keyMap[func].description}</dt>
        <dd>
          <kbd>{keyMap[func].key}</kbd>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <use href="#edit" />
          </svg>
        </dd>
      {/each}
    </dl>
  </div>
{/if}

<svelte:window
  on:keydown={(event) => {
    switch (event.code) {
      case keyMap.SOFT.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        softOnOff.set(true);
        break;

      case keyMap.SUSTAIN.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        sustainOnOff.set(true);
        break;

      case keyMap.ACCENT.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        accentOnOff.set(true);
        break;

      case keyMap.PLAY_PAUSE.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        $activeShortcutKeys.playPause = true;
        playPauseApp();
        break;

      case keyMap.REWIND.code:
        if (!event.ctrlKey && !event.shiftKey) event.preventDefault();
        $activeShortcutKeys.rewind = true;
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
        $activeShortcutKeys.volumeUp = true;
        increment(config.volume, event);
        break;

      case keyMap.VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.volumeDown = true;
        decrement(config.volume, event);
        break;

      case keyMap.BASS_VOLUME_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.bassVolumeUp = true;
        increment(config.bassVolume, event);
        break;

      case keyMap.BASS_VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.bassVolumeDown = true;
        decrement(config.bassVolume, event);
        break;

      case keyMap.TREBLE_VOLUME_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.trebleVolumeUp = true;
        increment(config.trebleVolume, event);
        break;

      case keyMap.TREBLE_VOLUME_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.trebleVolumeDown = true;
        decrement(config.trebleVolume, event);
        break;

      case keyMap.TEMPO_UP.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.tempoUp = true;
        increment(config.tempo, event);
        break;

      case keyMap.TEMPO_DOWN.code:
        if (!(event.ctrlKey && event.shiftKey)) event.preventDefault();
        $activeShortcutKeys.tempoDown = true;
        decrement(config.tempo, event);
        break;

      // no default
    }
  }}
  on:keyup={({ code }) => {
    actionInterval?.clear();
    actionInterval = undefined;

    switch (code) {
      case keyMap.SOFT.code:
        softOnOff.set(false);
        break;

      case keyMap.SUSTAIN.code:
        sustainOnOff.set(false);
        break;

      case keyMap.ACCENT.code:
        accentOnOff.set(false);
        break;

      case keyMap.PLAY_PAUSE.code:
        $activeShortcutKeys.playPause = false;
        break;

      case keyMap.REWIND.code:
        $activeShortcutKeys.rewind = false;
        break;

      case keyMap.VOLUME_UP.code:
        $activeShortcutKeys.volumeUp = false;
        break;

      case keyMap.VOLUME_DOWN.code:
        $activeShortcutKeys.volumeDown = false;
        break;

      case keyMap.BASS_VOLUME_UP.code:
        $activeShortcutKeys.bassVolumeUp = false;
        break;

      case keyMap.BASS_VOLUME_DOWN.code:
        $activeShortcutKeys.bassVolumeDown = false;
        break;

      case keyMap.TREBLE_VOLUME_UP.code:
        $activeShortcutKeys.trebleVolumeUp = false;
        break;

      case keyMap.TREBLE_VOLUME_DOWN.code:
        $activeShortcutKeys.trebleVolumeDown = false;
        break;

      case keyMap.TEMPO_UP.code:
        $activeShortcutKeys.tempoUp = false;
        break;

      case keyMap.TEMPO_DOWN.code:
        $activeShortcutKeys.tempoDown = false;
        break;

      // no default
    }
  }}
/>

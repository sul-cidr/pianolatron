import { writable, derived, get } from "svelte/store";
import watchMedia from "./mq-store";

const createStore = (defaultValue) => {
  const { set, subscribe, update } = writable(defaultValue);
  return {
    reset: () => set(defaultValue),
    set,
    subscribe,
    update,
  };
};

export const createPersistedStore = (key, defaultValue) => {
  const persistedValue = localStorage.getItem(key);
  let initialValue;
  try {
    initialValue = persistedValue ? JSON.parse(persistedValue) : defaultValue;
  } catch {
    initialValue = defaultValue;
  }
  const store = writable(initialValue);
  const { set, subscribe } = store;
  return {
    set(value) {
      localStorage.setItem(key, JSON.stringify(value));
      set(value);
    },
    update(fn) {
      const value = fn(get(store));
      this.set(value);
    },
    reset: () => this.set(defaultValue),
    subscribe,
  };
};

const createSetStore = () => {
  const { subscribe, update, set } = writable(new Set());
  return {
    subscribe,
    add: (el) => update((wrappedSet) => wrappedSet.add(el)),
    delete: (el) =>
      update((wrappedSet) => {
        wrappedSet.delete(el);
        return wrappedSet;
      }),
    reset: (newValue) => set(new Set(newValue)),
  };
};

// Metadata
export const rollMetadata = createStore({});
export const rollHasExpressions = derived(
  rollMetadata,
  ($rollMetadata) => $rollMetadata.ROLL_TYPE !== "65-note",
);
export const isReproducingRoll = derived(rollMetadata, ($rollMetadata) =>
  ["welte-red", "welte-green", "welte-licensee"].includes(
    $rollMetadata.ROLL_TYPE,
  ),
);

// Pedaling
export const softOnOff = createStore(false);
export const sustainOnOff = createStore(false);
export const accentOnOff = createStore(false);

// Playback Settings
export const volumeCoefficient = createStore(1.5);
export const bassVolumeCoefficient = createStore(1);
export const trebleVolumeCoefficient = createStore(1);

export const tempoCoefficient = createStore(1);

export const playExpressionsOnOff = createStore(true);
export const rollPedalingOnOff = createStore(true);
export const useMidiTempoEventsOnOff = createStore(true);

// Playback State
export const currentTick = createStore(0);
export const playbackProgress = createStore(0);
export const activeNotes = createSetStore();

// User Settings
export const showKeyboard = createPersistedStore("showKeyboard", true);
export const overlayKeyboard = createPersistedStore("overlayKeyboard", false);
export const userSettings = createPersistedStore("userSettings", {
  theme: "cardinal",
  activeNoteDetails: false,
  showNoteVelocities: false,
  highlightEnabledHoles: false,
});

// Browser State
export const media = watchMedia({
  narrow: "(max-width: 849px)",
  normal: "(min-width: 850px)",
  wide: "(min-width: 1400px)",
  hover: "(hover: hover)",
});

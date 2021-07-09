import { writable, derived } from "svelte/store";
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
  ($rollMetadata) => $rollMetadata.ROLL_TYPE === "welte-red",
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

//
export const activeShortcutKeys = createStore({
  volumeUp: false,
  volumeDown: false,
  tempoUp: false,
  tempoDown: false,
});

// Playback State
export const currentTick = createStore(0);
export const playbackProgress = createStore(0);
export const activeNotes = createSetStore();

// User Settings
export const showKeyboard = createStore(true);
export const overlayKeyboard = createStore(false);
export const userSettings = createStore({
  theme: "cardinal",
  activeNoteDetails: false,
});

// Browser State
export const media = watchMedia({
  narrow: "(max-width: 849px)",
  normal: "(min-width: 850px)",
  wide: "(min-width: 1400px)",
  hover: "(hover: hover)",
});

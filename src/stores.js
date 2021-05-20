import { writable } from "svelte/store";
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
    reset: () => set(new Set()),
  };
};

export const tempoControl = createStore(1);
export const rollMetadata = createStore({});

export const soft = createStore(false);
export const sustain = createStore(false);
export const accent = createStore(false);

export const volume = createStore(1);
export const bassVolume = createStore(1);
export const trebleVolume = createStore(1);

export const playbackProgress = createStore(0);
export const currentTick = createStore(0);

export const activeNotes = createSetStore();

export const overlayKeyboard = createStore(false);

export const userSettings = createStore({
  theme: "cardinal",
  activeNoteDetails: false,
});

export const media = watchMedia({
  narrow: "(max-width: 849px)",
  normal: "(min-width: 850px)",
  wide: "(min-width: 1400px)",
  hover: "(hover: hover)",
});

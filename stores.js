import { writable } from "./_snowpack/pkg/svelte/store.js";

export const tempoControl = writable(60);
export const rollMetadata = writable({});
export const pedalling = writable({
  soft: false,
  sustain: false,
  accent: false,
});
export const volume = writable({ master: 1, left: 1, right: 1 });

export const playbackProgress = writable(0);
export const currentTick = writable(0);

export const activeNotes = (() => {
  const { subscribe, update, set } = writable(new Set());
  return {
    subscribe,
    add: (el) => update((_activeNotes) => _activeNotes.add(el)),
    delete: (el) =>
      update((_activeNotes) => {
        _activeNotes.delete(el);
        return _activeNotes;
      }),
    reset: () => set(new Set()),
  };
})();

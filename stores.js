import { writable } from "./_snowpack/pkg/svelte/store.js";

export const tempoControl = writable(60);
export const rollMetadata = writable({});
export const pedalling = writable({ soft: false, sustain: false });
export const volume = writable({ master: 1, left: 1, right: 1 });

export const playbackProgress = writable(0);

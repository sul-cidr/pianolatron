import { writable } from "svelte/store";

export const rollMetadata = writable({});
export const pedalling = writable({ soft: false, sustain: false });

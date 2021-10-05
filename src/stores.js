import { derived } from "svelte/store";
import {
  createStore,
  createSetStore,
  createPersistedStore,
} from "./lib/stores";
import { watchMedia } from "./lib/mq-store";

// For piano settings
class KeyboardRegion {
  constructor(firstMidi, lastMidi) {
    this.firstMidi = firstMidi;
    this.lastMidi = lastMidi;
    this.velocityCurve = null;
    this.velocityPoints = null;
  }
}

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
export const scrollDownwards = derived(
  rollMetadata,
  ($rollMetadata) => $rollMetadata.ROLL_TYPE === "welte-red",
);

// Pedaling
export const softOnOff = createStore(false);
export const sustainOnOff = createStore(false);
export const accentOnOff = createStore(false);
export const sustainFromExternalMidi = createStore(false);
export const softFromExternalMidi = createStore(false);

// Playback Settings
export const volumeCoefficient = createStore(1.5);
export const bassVolumeCoefficient = createStore(1);
export const trebleVolumeCoefficient = createStore(1);

export const tempoCoefficient = createStore(1);

export const playExpressionsOnOff = createStore(true);
export const rollPedalingOnOff = createStore(true);
export const useMidiTempoEventsOnOff = createStore(true);

// Piano Settings
export const sampleVolumes = createPersistedStore("sampleVolumes", {
  strings: -15,
  harmonics: -10,
  pedal: -10,
  keybed: -10,
});
export const sampleVelocities = createPersistedStore("sampleVelocities", 4);
export const reverbWetDry = createPersistedStore("reverbWetDry", 0.8);
export const velocityCurveLow = createPersistedStore(
  "velocityCurveLow",
  new KeyboardRegion(21, 49),
);
export const velocityCurveMid = createPersistedStore(
  "velocityCurveMid",
  new KeyboardRegion(50, 78),
);
export const velocityCurveHigh = createPersistedStore(
  "velocityCurveHigh",
  new KeyboardRegion(79, 108),
);

// MIDI Devices
export const midiInputs = createStore([]);
export const midiOutputs = createStore([]);

// Playback State
export const currentTick = createStore(0);
export const playbackProgress = createStore(0);
export const activeNotes = createSetStore();

// Recording state
export const recordingOnOff = createStore(false);
export const recordingInBuffer = createStore(false);

// User Settings
export const userSettings = createPersistedStore("userSettings", {
  theme: "cardinal",
  activeNoteDetails: false,
  showNoteVelocities: false,
  highlightEnabledHoles: false,
  showKeyboard: true,
  overlayKeyboard: false,
  welcomeScreenInhibited: false,
  useWebMidi: false,
});

// Browser State
export const media = watchMedia({
  narrow: "(max-width: 849px)",
  normal: "(min-width: 850px)",
  wide: "(min-width: 1400px)",
  hover: "(hover: hover)",
});

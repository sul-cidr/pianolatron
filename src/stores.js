import { derived, writable } from "svelte/store";
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

// App state
export const appMode = createStore("perform");
export const appWaiting = createStore(false);
export const rollBeingBookmarked = createStore(false);

// Metadata
export const rollMetadata = createStore({});
export const rollHasExpressions = derived(
  rollMetadata,
  ($rollMetadata) => $rollMetadata.ROLL_TYPE !== "65-note",
);
export const isReproducingRoll = derived(rollMetadata, ($rollMetadata) =>
  ["welte-red", "welte-green", "welte-licensee", "duo-art"].includes(
    $rollMetadata.ROLL_TYPE,
  ),
);
export const scrollDownwards = derived(
  rollMetadata,
  ($rollMetadata) => $rollMetadata.ROLL_TYPE === "welte-red",
);

export const holesIntervalTree = writable();

// Pedaling
export const softOnOff = createStore(false);
export const sustainOnOff = createStore(false);
export const accentOnOff = createStore(false);
export const sustainFromExternalMidi = createStore(false);
export const softFromExternalMidi = createStore(false);
export const softPedalRatio = createStore(0.67);
export const accentBump = createStore(1.5);

// Playback Settings
export const volumeCoefficient = createStore(1);
export const bassVolumeCoefficient = createStore(1);
export const trebleVolumeCoefficient = createStore(1);

export const tempoCoefficient = createStore(1);
export const transposeHalfStep = createStore(0);

export const playExpressionsOnOff = createStore(true);
export const rollPedalingOnOff = createStore(true);
export const useMidiTempoEventsOnOff = createStore(true);
export const ticksPerSecond = createStore(0);

export const useInAppExpression = createStore(false);
export const expressionBox = createStore();

// Piano Settings
export const sampleVolumes = createPersistedStore("sampleVolumes", {
  strings: -10,
  harmonics: -10,
  pedal: -10,
  keybed: -10,
});
export const sampleVelocities = createPersistedStore("sampleVelocities", 8);
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

// Game Controller
export const gameController = createStore(undefined);
export const volumeSensitivity = createStore(70);
export const tempoSensitivity = createStore(30);

// Recording State
export const recordingOnOff = createStore(false);
export const recordingInBuffer = createStore(false);
export const recordingDuration = createStore(0);

// Expression Curves
export const bassExpCurve = createStore();
export const trebleExpCurve = createStore();
export const expressionParameters = createStore({});
export const expBoxType = createStore(null);
export const drawVelocityCurves = createStore(false);

// Playback State
export const isPlaying = createStore(false);
export const currentTick = createStore(0);
export const playbackProgress = createStore(0);
export const playbackProgressStart = createStore();
export const playbackProgressEnd = createStore(1);
export const activeNotes = createSetStore();
export const playRepeat = createStore(false);

// User Settings
export const userSettings = createPersistedStore("userSettings", {
  theme: "cardinal",
  activeNoteDetails: false,
  showNoteVelocities: false,
  highlightEnabledHoles: false,
  showKeyboard: true,
  overlayKeyboard: false,
  useWebMidi: false,
  showRuler: false,
});

// Browser State
export const media = watchMedia({
  narrow: "(max-width: 849px)",
  normal: "(min-width: 850px)",
  wide: "(min-width: 1400px)",
  hover: "(hover: hover)",
});

// Latency warnings
export const latencyDetected = createStore(false);
export const showLatencyWarning = createStore(true);

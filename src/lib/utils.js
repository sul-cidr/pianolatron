import { rollProfile } from "../config/roll-config";

// An enum for where notes are coming from
export const NoteSource = {
  Keyboard: 0,
  Midi: 1,
  WebMidi: 2,
};

export const RecordingActions = {
  Clear: 0,
  ExportMIDI: 1,
  ExportWAV: 2,
  Toggle: 3,
};

const modes = new Set(["perform", "listen", "embed"]);
export const getMode = (mode) => (modes.has(mode) ? mode : "perform");

export const getPathJoiner = (base) => {
  const noSlashBase = base.replace(/[/]+$/, "");
  return (...parts) => [noSlashBase, ...parts].join("/");
};

export const enforcePrecision = (value, precision) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Return a float between 0 and 1 proportional to value's position between min
// and max
export const normalizeInRange = (value, min, max) => {
  if (max - min === 0) return 0.5;
  return (value - min) / (max - min);
};

export const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

// Return a float between min and max proportional to value's position between
// 0 and 1
export const mapToRange = (value, min, max) => value * (max - min) + min;

export const getNoteName = (midiNumber) => {
  const octave = parseInt(midiNumber / 12, 10) - 1;
  const name = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
  ][(midiNumber - 21) % 12];
  return `${name}${octave}`;
};

export const getHoleLabel = (midiNumber, rollType = "welte-red") => {
  const {
    bassNotesBegin: notesBegin,
    trebleNotesEnd: notesEnd,
    ctrlMap,
  } = rollProfile[rollType];

  if (midiNumber >= notesBegin && midiNumber <= notesEnd)
    return getNoteName(midiNumber);

  if (ctrlMap && ctrlMap[midiNumber]) return ctrlMap[midiNumber];

  return `mid_${midiNumber}`;
};

export const easingInterval = (
  fn,
  startInterval = 200,
  endInterval = 5,
  divisor = 1.1,
) => {
  let timeoutId;
  let interval = startInterval;
  const wrapped = () => {
    fn();
    interval = Math.max(Math.floor(interval / divisor), endInterval);
    timeoutId = setTimeout(wrapped, interval);
  };

  timeoutId = setTimeout(wrapped, interval);

  return {
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
};

// This is the "coolwarm" color map -- blue to red
// RdYlBu (reversed) sort of works, but the yellows are too ambiguous
// (values in H, S, L)
export const holeColorMap = [
  "232, 53%, 49%",
  "229, 64%, 58%",
  "225, 78%, 66%",
  "223, 91%, 73%",
  "221, 98%, 79%",
  "219, 95%, 83%",
  "217, 73%, 86%",
  "21, 28%, 86%",
  "20, 69%, 83%",
  "18, 85%, 79%",
  "16, 85%, 73%",
  "13, 80%, 67%",
  "9, 70%, 59%",
  "2, 59%, 51%",
  "348, 96%, 36%",
];

export const defaultHoleColor = "60, 100%, 50%"; // yellow (default)
export const controlHoleColor = "120, 73%, 75%"; // light green
export const pedalHoleColor = "39, 100%, 50%"; // orange;

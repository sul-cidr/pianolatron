import { rollProfile } from "./roll-config";

export const enforcePrecision = (value, precision) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Return a float between 0 and 1 proportional to value's position between min
// and max
export const normalizeInRange = (value, min, max) => {
  if (max - min === 0) {
    return 0;
  }
  return (value - min) / (max - min);
};

// Return a float beteen min and max proportional to value's position between
// 0 and 1
export const mapToRange = (value, min, max) => value * (max - min) + min;

export const hexToRGBA = (hex, alpha) => {
  const rgb = hex
    .replace(/[^0-9a-f]/gi, "")
    .match(/.{1,2}/g)
    .map((h) => parseInt(h, 16));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
};

export const isControlHole = (midiNumber, rollType) =>
  midiNumber < rollProfile[rollType].bassNotesBegin ||
  midiNumber > rollProfile[rollType].trebleNotesEnd;

export const isPedalHole = (midiNumber, rollType) =>
  isControlHole(midiNumber, rollType) &&
  rollProfile[rollType].ctrlMap[midiNumber] !== undefined &&
  (rollProfile[rollType].ctrlMap[midiNumber].includes("soft") ||
    rollProfile[rollType].ctrlMap[midiNumber].includes("sust"));

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

export const getNoteLabel = (midiNumber, rollType = "welte-red") => {
  let noteLabel = `mid_${midiNumber}`;

  if (
    midiNumber >= rollProfile[rollType].bassNotesBegin &&
    midiNumber <= rollProfile[rollType].trebleNotesEnd
  ) {
    noteLabel = getNoteName(midiNumber);
  } else if (
    "ctrlMap" in rollProfile[rollType] &&
    midiNumber in rollProfile[rollType].ctrlMap
  ) {
    noteLabel = rollProfile[rollType].ctrlMap[midiNumber];
  }

  return noteLabel;
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

export const enforcePrecision = (value, precision) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const rollProfile = {
  "welte-red": {
    bassCtrlBegin: 14,
    bassCtrlEnd: 23,
    bassNotesBegin: 24,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 103,
    trebleCtrlBegin: 104,
    trebleCtrlEnd: 113,
    ctrlMap: {
      14: "mf_off",
      15: "mf_on",
      16: "cresc_off",
      17: "cresc_on",
      18: "sf_off",
      19: "sf_on",
      20: "soft_off",
      21: "soft_on",
      22: "motor_off",
      23: "motor_on",
      104: "rewind",
      105: "elec_off",
      106: "sust_on",
      107: "sust_off",
      108: "sf_on",
      109: "sf_off",
      110: "cresc_on",
      111: "cresc_off",
      112: "mf_on",
      113: "mf_off",
    },
  },
  "welte-green": {
    bassCtrlBegin: 16,
    bassCtrlEnd: 20,
    bassNotesBegin: 21,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 108,
    trebleCtrlBegin: 109,
    trebleCtrlEnd: 113,
    ctrlMap: {
      16: "sfp",
      17: "mf",
      18: "sust",
      19: "cresc",
      20: "sff",
      109: "sff",
      110: "cresc",
      111: "soft",
      112: "mf",
      113: "sfp",
    },
  },
  "welte-licensee": {
    bassCtrlBegin: 16,
    bassCtrlEnd: 23,
    bassNotesBegin: 24,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 103,
    trebleCtrlBegin: 104,
    trebleCtrlEnd: 113,
    ctrlMap: {
      16: "mf_off",
      17: "mf_on",
      18: "cresc_off",
      19: "cresc_on",
      20: "sf_on",
      21: "sf_off",
      22: "soft_on",
      23: "soft_off",
      104: "rewind",
      106: "sust_on",
      107: "sust_off",
      108: "sf_on",
      109: "sf_off",
      110: "cresc_on",
      111: "cresc_off",
      112: "mf_on",
      113: "mf_off",
    },
  },
  "65-note": {
    notesBegin: 33,
    notesEnd: 97,
  },
  "88-note": {
    bassCtrlBegin: 15,
    bassCtrlEnd: 20,
    bassNotesBegin: 21,
    trebleNotesEnd: 108,
    trebleCtrlBegin: 109,
    trebleCtrlEnd: 110,
    ctrlMap: {
      16: "rewind",
      18: "sust",
      109: "acc",
      110: "acc",
    },
  },
};

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
  } else if (midiNumber in rollProfile[rollType].ctrlMap) {
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

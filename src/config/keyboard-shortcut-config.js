export const defaultKeyMap = {
  SOFT: {
    code: "KeyB",
    key: "b",
    description: "Soft Pedal",
    help: "Hold to apply the soft pedal",
  },
  SUSTAIN: {
    code: "Space",
    key: "＿",
    description: "Sustain Pedal",
    help: "Hold to apply the sustain pedal",
  },
  ACCENT: {
    code: "KeyN",
    key: "n",
    description: "Accent Button",
    help: "Notes struck while this is held with be 50% louder",
  },

  VOLUME_UP: {
    code: "KeyO",
    key: "o",
    description: "Volume Up",
    help: `Increase the main volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  VOLUME_DOWN: {
    code: "KeyI",
    key: "i",
    description: "Volume Down",
    help: `Decrease the main volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  BASS_VOLUME_UP: {
    code: "Digit4",
    key: "4",
    description: "Bass Volume Up",
    help: `Increase the bass volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  BASS_VOLUME_DOWN: {
    code: "KeyE",
    key: "e",
    description: "Bass Volume Down",
    help: `Decrease the bass volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  TREBLE_VOLUME_UP: {
    code: "Digit0",
    key: "0",
    description: "Treble Volume Up",
    help: `Increase the treble volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  TREBLE_VOLUME_DOWN: {
    code: "KeyP",
    key: "p",
    description: "Treble Volume Down",
    help: `Decrease the treble volume
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },

  TEMPO_UP: {
    code: "KeyT",
    key: "t",
    description: "Tempo Up",
    help: `Increase the tempo
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },
  TEMPO_DOWN: {
    code: "KeyR",
    key: "r",
    description: "Tempo Down",
    help: `Decrease the tempo
        Use SHIFT for a larger increment, and CTRL for finer-grained control`,
  },

  PLAY_PAUSE: {
    code: "Digit7",
    key: "7",
    description: "Play/Pause",
    help: "Play or pause the roll playback",
  },
  REWIND: {
    code: "Backspace",
    key: "⌫",
    description: "Rewind Roll",
    help: "Rewind the roll to the beginning",
  },
  FORWARD: {
    code: "Digit8",
    key: "8",
    description: "Scrub Forwards",
    help: "Advance the roll (hold to accelerate)",
  },
  BACKWARD: {
    code: "Digit6",
    key: "6",
    description: "Scrub Backwards",
    help: "Back up (hold to accelerate)",
  },
  PAN_UP: {
    code: "ArrowUp",
    key: "↑",
    description: "Pan Upwards",
    help: "Pan the roll upwards (hold to accelerate)",
  },
  PAN_DOWN: {
    code: "ArrowDown",
    key: "↓",
    description: "Pan Downwards",
    help: "Pan the roll downwards (hold to accelerate)",
  },
};

export const unusableKeys = [
  "Escape",
  "ControlLeft",
  "ControlRight",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
  "CapsLock",
];

export const alternativeIndicatorText = {
  Space: "＿",
  Backspace: "⌫",
  Delete: "⌦",
  NumpadEnter: "⏎",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

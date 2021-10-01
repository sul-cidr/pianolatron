export const defaultKeyMap = {
  SOFT: { code: "KeyB", key: "b" },
  SUSTAIN: { code: "Space", key: "＿" },
  ACCENT: { code: "KeyN", key: "n" },

  VOLUME_UP: { code: "KeyO", key: "o" },
  VOLUME_DOWN: { code: "KeyI", key: "i" },
  BASS_VOLUME_UP: { code: "Digit4", key: "4" },
  BASS_VOLUME_DOWN: { code: "KeyE", key: "e" },
  TREBLE_VOLUME_UP: { code: "Digit0", key: "0" },
  TREBLE_VOLUME_DOWN: { code: "KeyP", key: "p" },

  TEMPO_UP: { code: "KeyT", key: "t" },
  TEMPO_DOWN: { code: "KeyR", key: "r" },

  LEFT_HAND_AUGMENT: { code: "KeyW", key: "w" },
  RIGHT_HAND_AUGMENT: { code: "BracketLeft", key: "[" },

  PLAY_PAUSE: { code: "Digit7", key: "7" },
  REWIND: { code: "Backspace", key: "⌫" },
  FORWARD: { code: "Digit8", key: "8" },
  BACKWARD: { code: "Digit6", key: "6" },
  PAN_UP: { code: "ArrowUp", key: "↑" },
  PAN_DOWN: { code: "ArrowDown", key: "↓" },
};

export const keyMapMeta = {
  SOFT: {
    description: "Soft Pedal",
    help: "Hold to apply the soft pedal",
  },
  SUSTAIN: {
    description: "Sustain Pedal",
    help: "Hold to apply the sustain pedal",
  },
  ACCENT: {
    description: "Accent Button",
    help: "Notes struck while this is held with be 50% louder",
  },

  VOLUME_UP: {
    description: "Volume Up",
    help: `Increase the main volume`,
  },
  VOLUME_DOWN: {
    description: "Volume Down",
    help: `Decrease the main volume`,
  },
  BASS_VOLUME_UP: {
    description: "Bass Volume Up",
    help: `Increase the bass volume`,
  },
  BASS_VOLUME_DOWN: {
    description: "Bass Volume Down",
    help: `Decrease the bass volume`,
  },
  TREBLE_VOLUME_UP: {
    description: "Treble Volume Up",
    help: `Increase the treble volume`,
  },
  TREBLE_VOLUME_DOWN: {
    description: "Treble Volume Down",
    help: `Decrease the treble volume`,
  },

  TEMPO_UP: {
    description: "Tempo Up",
    help: `Increase the tempo`,
  },
  TEMPO_DOWN: {
    description: "Tempo Down",
    help: `Decrease the tempo`,
  },

  LEFT_HAND_AUGMENT: {
    description: "Left-hand Augment",
    help: "Hold this key to use larger jumps when using Tempo or Bass Volume keys",
  },
  RIGHT_HAND_AUGMENT: {
    description: "Right-hand Augment",
    help: "Hold this key to use larger jumps when using Volume or Treble Volume keys",
  },

  PLAY_PAUSE: {
    description: "Play/Pause",
    help: "Play or pause the roll playback",
  },
  REWIND: {
    description: "Rewind Roll",
    help: "Rewind the roll to the beginning",
  },
  FORWARD: {
    description: "Scrub Forwards",
    help: "Advance the roll (hold to accelerate)",
  },
  BACKWARD: {
    description: "Scrub Backwards",
    help: "Back up (hold to accelerate)",
  },
  PAN_UP: {
    description: "Pan Upwards",
    help: "Pan the roll upwards (hold to accelerate)",
  },
  PAN_DOWN: {
    description: "Pan Downwards",
    help: "Pan the roll downwards (hold to accelerate)",
  },
};

export const unusableKeys = ["Escape", "CapsLock"];

export const alternativeIndicatorText = {
  Space: "＿",
  Backspace: "⌫",
  Delete: "⌦",
  NumpadEnter: "⏎",
  Enter: "⏎",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ControlLeft: " (L)Ctrl",
  ControlRight: "(R)Ctrl",
  ShiftLeft: "(L)Shift",
  ShiftRight: "(R)Shift",
};

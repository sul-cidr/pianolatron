/* eslint-disable prefer-const */ // FIXME
import MidiPlayer from "midi-player-js";
import { Piano } from "@tonejs/piano";

import { rollMetadata, pedalling } from "../stores";

let softPedalOn;
pedalling.subscribe(({ soft }) => {
  softPedalOn = soft;
});

const decodeHtmlEntities = (string) =>
  string
    .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
    .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
      String.fromCodePoint(parseInt(num, 16)),
    );

export const midiSamplePlayer = new MidiPlayer.Player();

export const playPauseMidiFile = () => {
  if (midiSamplePlayer.isPlaying()) {
    midiSamplePlayer.pause();
  } else {
    midiSamplePlayer.play();
  }
};

export const stopMidiFile = () => {
  midiSamplePlayer.stop();
};

midiSamplePlayer.on("fileLoaded", () => {
  const metadataTrack = midiSamplePlayer.events[0];
  /* @IMAGE_WIDTH and @IMAGE_LENGTH should be the same as from viewport._contentSize
   * Can't think of why they wouldn't be, but maybe check anyway. Would need to scale
   * all pixel values if so.
   * Other potentially useful values, e.g., for drawing overlays:
   * @ROLL_WIDTH (this is smaller than the image width)
   * @HARD_MARGIN_TREBLE
   * @HARD_MARGIN_BASS
   * @HOLE_SEPARATION
   * @HOLE_OFFSET
   * All of the source/performance/recording metadata is in this track as well.
   */

  rollMetadata.set(
    Object.fromEntries(
      metadataTrack
        .filter((event) => event.name === "Text Event")
        .map((event) =>
          event.string
            .match(/^@([^:]*):[\t\s]*(.*)$/)
            .slice(1, 3)
            .map((value) => decodeHtmlEntities(value)),
        ),
    ),
  );
});

const controllerChange = Object.freeze({
  SUSTAIN_PEDAL: 64,
  SOFT_PEDAL: 67, // (una corda)
  PEDAL_ON: 127,
  PANNING_POSITION: 10,
});

const DEFAULT_NOTE_VELOCITY = 33.0;
const SOFT_PEDAL_RATIO = 0.67;
const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"

const BASE_DATA_URL = "https://broadwell.github.io/javatron/";

let masterVolumeRatio = 1.0;
let leftVolumeRatio = 1.0;
let rightVolumeRatio = 1.0;
let panBoundary = HALF_BOUNDARY;

const piano = new Piano({
  // XXX The samples load from the guy's Github site
  // unless there's a valid URL, and using a
  // local folder seems problematic...
  url: `${BASE_DATA_URL}audio/mp3/`, // works if available
  // url: '/audio/', // note sure we want to try to bundle these...
  velocities: 8,
  release: true,
  pedal: true,
  maxPolyphony: 64,
}).toDestination();

export const pianoReady = piano.load();

const startNote = (noteNumber, velocity = DEFAULT_NOTE_VELOCITY) => {
  const modifiedVelocity =
    (velocity / 128) *
    ((softPedalOn && SOFT_PEDAL_RATIO) || 1) *
    masterVolumeRatio *
    (noteNumber < panBoundary ? leftVolumeRatio : rightVolumeRatio);

  piano.keyDown({
    midi: noteNumber,
    velocity: Math.min(modifiedVelocity, 1),
  });
};

const stopNote = (noteNumber) => {
  piano.keyUp({ midi: noteNumber });
};

midiSamplePlayer.on(
  "midiEvent",
  ({ name, value, number, noteNumber, velocity }) => {
    if (name === "Note on") {
      if (velocity === 0) {
        // Note off
        stopNote(noteNumber);
      } else {
        // Note on
        startNote(noteNumber, velocity);
      }
    } else if (name === "Controller Change") {
      if (number === controllerChange.SUSTAIN_PEDAL) {
        if (value === controllerChange.PEDAL_ON) {
          piano.pedalDown();
          pedalling.update((val) => ({ ...val, sustain: true }));
        } else {
          piano.pedalUp();
          pedalling.update((val) => ({ ...val, sustain: false }));
        }
      } else if (number === controllerChange.SOFT_PEDAL) {
        pedalling.update((val) => ({
          ...val,
          soft: value === controllerChange.PEDAL_ON,
        }));
      }
    }
  },
);

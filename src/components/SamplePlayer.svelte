<script context="module">
  /* eslint-disable prefer-const */ // FIXME
  import MidiPlayer from "midi-player-js";
  import { Piano } from "@tonejs/piano";

  const decodeHtmlEntities = (string) =>
    string
      .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
      .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
        String.fromCodePoint(parseInt(num, 16)),
      );

  export const midiSamplePlayer = new MidiPlayer.Player();

  export let rollMetadata;

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

    rollMetadata = Object.fromEntries(
      metadataTrack
        .filter((event) => event.name === "Text Event")
        .map((event) =>
          event.string
            .match(/^@([^:]*):[\t\s]*(.*)$/)
            .slice(1, 3)
            .map((value) => decodeHtmlEntities(value)),
        ),
    );
  });

  const DEFAULT_NOTE_VELOCITY = 33.0;
  const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"

  const BASE_DATA_URL = "https://broadwell.github.io/javatron/";

  const activeNotes = [];
  const playComputedExpressions = true;
  let volumeRatio = 1.0;
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

  piano.load();

  const startNote = (noteNumber, velocity) => {
    if (velocity > 0) {
      piano.keyDown({
        midi: noteNumber,
        velocity: Math.min(velocity || DEFAULT_NOTE_VELOCITY / 128.0, 1.0),
      });
    }
  };

  const stopNote = (noteNumber) => {
    piano.keyUp({ midi: noteNumber });
  };

  midiSamplePlayer.on("midiEvent", ({ name, noteNumber, velocity }) => {
    if (name === "Note on") {
      if (velocity === 0) {
        // Note off
        while (activeNotes.includes(parseInt(noteNumber, 10))) {
          activeNotes.splice(activeNotes.indexOf(parseInt(noteNumber, 10)), 1);
        }
        stopNote(noteNumber);
      } else {
        // Note on
        let updatedVolume = (velocity / 128.0) * volumeRatio;
        if (parseInt(noteNumber, 10) < panBoundary) {
          updatedVolume *= leftVolumeRatio;
        } else if (parseInt(noteNumber, 10) >= panBoundary) {
          updatedVolume *= rightVolumeRatio;
        }
        startNote(noteNumber, updatedVolume);

        if (!activeNotes.includes(noteNumber)) {
          activeNotes.push(parseInt(noteNumber, 10));
        }
      }
    }
  });
</script>

<script>
  import MidiPlayer from "midi-player-js";
  import { Piano } from "@tonejs/piano";

  import {
    rollMetadata,
    softOnOff,
    sustainOnOff,
    accentOnOff,
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playExpressionsOnOff,
    rollPedalingOnOff,
    useMidiTempoEventsOnOff,
    activeNotes,
    currentTick,
  } from "../stores";

  let tempoMap;

  const controllerChange = Object.freeze({
    SUSTAIN_PEDAL: 64,
    SOFT_PEDAL: 67, // (una corda)
    PEDAL_ON: 127,
    PANNING_POSITION: 10,
  });

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"
  const ACCENT_BUMP = 1.5;

  const midiSamplePlayer = new MidiPlayer.Player();

  const piano = new Piano({
    url: "assets/samples/",
    velocities: 2,
    release: true,
    pedal: true,
    maxPolyphony: 64,
  }).toDestination();

  const pianoReady = piano.load();

  const getTempoAtTick = (tick) => {
    if (!tempoMap || !$useMidiTempoEventsOnOff) return DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
      [, tempo] = tempoMap[i];
      i += 1;
      if (i >= tempoMap.length) break;
    }
    return tempo;
  };

  const updatePlayer = (fn = () => {}) => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      fn();
      midiSamplePlayer.setTempo(
        getTempoAtTick($currentTick) * $tempoCoefficient,
      );
      midiSamplePlayer.play();
      return;
    }
    fn();
    midiSamplePlayer.setTempo(getTempoAtTick($currentTick) * $tempoCoefficient);
  };

  const startNote = (noteNumber, velocity) => {
    const modifiedVelocity =
      ((($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100) *
      (($softOnOff && SOFT_PEDAL_RATIO) || 1) *
      (($accentOnOff && ACCENT_BUMP) || 1) *
      $volumeCoefficient *
      (noteNumber < HALF_BOUNDARY
        ? $bassVolumeCoefficient
        : $trebleVolumeCoefficient);
    if (modifiedVelocity) {
      piano.keyDown({
        midi: noteNumber,
        velocity: Math.min(modifiedVelocity, 1),
      });
    }
  };

  const stopNote = (noteNumber) => piano.keyUp({ midi: noteNumber });

  const stopAllNotes = () => {
    piano.pedalUp();
    if ($sustainOnOff) piano.pedalDown();
    $activeNotes.forEach(stopNote);
  };

  const resetPlayback = () => {
    currentTick.reset();
    midiSamplePlayer.stop();
  };

  const pausePlayback = () => {
    midiSamplePlayer.pause();
    stopAllNotes();
    activeNotes.reset();
    softOnOff.reset();
    sustainOnOff.reset();
    accentOnOff.reset();
  };

  const startPlayback = () => {
    if ($currentTick < 0) resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
  };

  midiSamplePlayer.on("fileLoaded", () => {
    const decodeHtmlEntities = (string) =>
      string
        .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
        .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
          String.fromCodePoint(parseInt(num, 16)),
        );

    const metadataTrack = midiSamplePlayer.events[0];

    rollMetadata.set(
      Object.fromEntries(
        metadataTrack
          .filter((event) => event.name === "Text Event")
          .map((event) =>
            event.string
              .match(/^@([^:]*):[\t\s]*(.*)$/)
              .slice(1, 3)
              .map(decodeHtmlEntities),
          ),
      ),
    );

    tempoMap = metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
  });

  midiSamplePlayer.on(
    "midiEvent",
    ({ name, value, number, noteNumber, velocity, data }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          stopNote(noteNumber);
          activeNotes.delete(noteNumber);
        } else {
          startNote(noteNumber, velocity);
          activeNotes.add(noteNumber);
        }
      } else if (name === "Controller Change" && $rollPedalingOnOff) {
        if (number === controllerChange.SUSTAIN_PEDAL) {
          if (value === controllerChange.PEDAL_ON) {
            piano.pedalDown();
            sustainOnOff.set(true);
          } else {
            piano.pedalUp();
            sustainOnOff.set(false);
          }
        } else if (number === controllerChange.SOFT_PEDAL) {
          softOnOff.set(value === controllerChange.PEDAL_ON);
        }
      } else if (name === "Set Tempo" && $useMidiTempoEventsOnOff) {
        midiSamplePlayer.setTempo(data * $tempoCoefficient);
      }
    },
  );

  midiSamplePlayer.on("endOfFile", pausePlayback);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $sustainOnOff ? piano.pedalDown() : piano.pedalUp();
  $: $tempoCoefficient, updatePlayer();
  $: $useMidiTempoEventsOnOff, updatePlayer();

  export {
    midiSamplePlayer,
    pianoReady,
    updatePlayer,
    startNote,
    stopNote,
    pausePlayback,
    startPlayback,
    resetPlayback,
  };
</script>

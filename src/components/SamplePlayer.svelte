<script context="module">
  import MidiPlayer from "midi-player-js";
  import { Piano } from "@tonejs/piano";

  import { get } from "svelte/store";
  import {
    rollMetadata,
    soft,
    sustain,
    accent,
    volume,
    bassVolume,
    trebleVolume,
    tempoControl,
    activeNotes,
    currentTick,
  } from "../stores";

  const midiSamplePlayer = new MidiPlayer.Player();

  let softPedalOn;
  let accentOn;

  let tempoMap;
  let tempoRatio = 1.0;

  const getTempoAtTick = (tick) => {
    if (!tempoMap) return 60;
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
      midiSamplePlayer.setTempo(getTempoAtTick(get(currentTick)) * tempoRatio);
      midiSamplePlayer.play();
      return;
    }
    fn();
    midiSamplePlayer.setTempo(getTempoAtTick(get(currentTick)) * tempoRatio);
  };

  tempoControl.subscribe((newTempo) => {
    tempoRatio = newTempo;
    updatePlayer();
  });

  const decodeHtmlEntities = (string) =>
    string
      .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
      .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
        String.fromCodePoint(parseInt(num, 16)),
      );

  midiSamplePlayer.on("fileLoaded", () => {
    const metadataTrack = midiSamplePlayer.events[0];
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

    tempoMap = metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);
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
  const ACCENT_BUMP = 1.5;

  const panBoundary = HALF_BOUNDARY;

  const piano = new Piano({
    url: "assets/samples/",
    velocities: 2,
    release: true,
    pedal: true,
    maxPolyphony: 64,
  }).toDestination();

  const pianoReady = piano.load();

  sustain.subscribe((_sustain) => {
    if (_sustain) {
      piano.pedalDown();
    } else {
      piano.pedalUp();
    }
  });

  soft.subscribe((_soft) => {
    softPedalOn = _soft;
  });

  accent.subscribe((_accent) => {
    accentOn = _accent;
  });

  const startNote = (noteNumber, velocity = DEFAULT_NOTE_VELOCITY) => {
    const modifiedVelocity =
      (velocity / 128) *
      ((softPedalOn && SOFT_PEDAL_RATIO) || 1) *
      ((accentOn && ACCENT_BUMP) || 1) *
      get(volume) *
      (noteNumber < panBoundary ? get(bassVolume) : get(trebleVolume));
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
    if (get(sustain)) piano.pedalDown();
    get(activeNotes).forEach((note) => stopNote(note));
  };

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
  });

  midiSamplePlayer.on(
    "midiEvent",
    ({ name, value, number, noteNumber, velocity, data }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          // Note off
          stopNote(noteNumber);
          activeNotes.delete(noteNumber);
        } else {
          // Note on
          startNote(noteNumber, velocity);
          activeNotes.add(noteNumber);
        }
      } else if (name === "Controller Change") {
        if (number === controllerChange.SUSTAIN_PEDAL) {
          if (value === controllerChange.PEDAL_ON) {
            piano.pedalDown();
            sustain.set(true);
          } else {
            piano.pedalUp();
            sustain.set(false);
          }
        } else if (number === controllerChange.SOFT_PEDAL) {
          soft.set(value === controllerChange.PEDAL_ON);
        }
      } else if (name === "Set Tempo") {
        midiSamplePlayer.setTempo(data * tempoRatio);
      }
    },
  );

  export {
    midiSamplePlayer,
    pianoReady,
    updatePlayer,
    startNote,
    stopNote,
    stopAllNotes,
  };
</script>

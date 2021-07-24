<script>
  import MidiPlayer from "midi-player-js";
  import { Piano } from "@tonejs/piano";
  import IntervalTree from "node-interval-tree";

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
  let pedalingMap;
  let notesMap;

  const SOFT_PEDAL = 67;
  const SUSTAIN_PEDAL = 64;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"
  const ACCENT_BUMP = 1.5;

  const midiSamplePlayer = new MidiPlayer.Player();

  const piano = new Piano({
    url: "assets/samples/",
    velocities: 4,
    release: true,
    pedal: true,
    maxPolyphony: 64,
    volume: {
      strings: -15,
      harmonics: -10,
      pedal: -10,
      keybed: -10,
    },
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

  const setPlayerStateAtTick = (tick = $currentTick) => {
    if (midiSamplePlayer.tracks[0])
      midiSamplePlayer.tracks[0].enabled = $useMidiTempoEventsOnOff;
    midiSamplePlayer.setTempo(getTempoAtTick(tick) * $tempoCoefficient);

    if (pedalingMap && $rollPedalingOnOff) {
      const pedals = pedalingMap.search($currentTick, $currentTick);
      sustainOnOff.set(pedals.includes(SUSTAIN_PEDAL));
      softOnOff.set(pedals.includes(SOFT_PEDAL));
    } else {
      sustainOnOff.set(false);
      piano.pedalUp();
      softOnOff.set(false);
    }

    if (notesMap) {
      activeNotes.reset(notesMap.search($currentTick, $currentTick));
    }
  };

  const updatePlayer = (fn = () => {}) => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      fn();
      setPlayerStateAtTick($currentTick);
      midiSamplePlayer.play();
      return;
    }
    fn();
    setPlayerStateAtTick($currentTick);
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
    activeNotes.reset();
    softOnOff.reset();
    sustainOnOff.reset();
    accentOnOff.reset();
  };

  const pausePlayback = () => {
    midiSamplePlayer.pause();
    stopAllNotes();
  };

  const startPlayback = () => {
    if ($currentTick < 0) resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
  };

  const buildTempoMap = (metadataTrack) =>
    metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);

  const buildPedalingMap = (eventsTrack) => {
    const _pedalingMap = new IntervalTree();
    const controllerEvents = eventsTrack.filter(
      (event) => event.name === "Controller Change",
    );

    const enterEvents = (eventNumber) => {
      let tickOn = false;
      controllerEvents
        .filter(({ number }) => number === eventNumber)
        .forEach(({ value, tick }) => {
          if (value === 0) {
            if (tickOn) _pedalingMap.insert(tickOn, tick, eventNumber);
            tickOn = false;
          } else if (value === 127) {
            if (!tickOn) tickOn = tick;
          }
        });
    };

    enterEvents(SOFT_PEDAL);
    enterEvents(SUSTAIN_PEDAL);

    return _pedalingMap;
  };

  const buildNotesMap = (musicTracks) => {
    const _notesMap = new IntervalTree();
    musicTracks.forEach((track) => {
      const tickOn = {};
      track
        .filter((event) => event.name === "Note on")
        .forEach(({ noteNumber, velocity, tick }) => {
          if (velocity === 0) {
            if (noteNumber in tickOn) {
              _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
              delete tickOn[noteNumber];
            }
          } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
        });
    });
    return _notesMap;
  };

  midiSamplePlayer.on("fileLoaded", () => {
    const decodeHtmlEntities = (string) =>
      string
        .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
        .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
          String.fromCodePoint(parseInt(num, 16)),
        );

    const [metadataTrack, ...musicTracks] = midiSamplePlayer.events;

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

    tempoMap = buildTempoMap(metadataTrack);

    // where two or more "music tracks" exist, pedal events are expected to have
    //  been duplicated across tracks, so we read only from the first one.
    pedalingMap = buildPedalingMap(musicTracks[0]);

    notesMap = buildNotesMap(musicTracks);
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
  });

  midiSamplePlayer.on(
    "midiEvent",
    ({ name, value, number, noteNumber, velocity }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          stopNote(noteNumber);
          activeNotes.delete(noteNumber);
        } else {
          startNote(noteNumber, velocity);
          activeNotes.add(noteNumber);
        }
      } else if (name === "Controller Change" && $rollPedalingOnOff) {
        if (number === SUSTAIN_PEDAL) {
          sustainOnOff.set(!!value);
        } else if (number === SOFT_PEDAL) {
          softOnOff.set(!!value);
        }
      }
    },
  );

  midiSamplePlayer.on("endOfFile", pausePlayback);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $sustainOnOff ? piano.pedalDown() : piano.pedalUp();
  $: $tempoCoefficient, updatePlayer();
  $: $useMidiTempoEventsOnOff, updatePlayer();
  $: $rollPedalingOnOff, updatePlayer();

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

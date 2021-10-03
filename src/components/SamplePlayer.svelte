<script>
  import MidiPlayer from "midi-player-js";
  import IntervalTree from "node-interval-tree";
  import { createEventDispatcher } from "svelte";
  import { Piano } from "../lib/pianolatron-piano";
  import { notify } from "../ui-components/Notification.svelte";
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
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
  } from "../stores";

  let tempoMap;
  let pedalingMap;
  let notesMap;
  let midiOuts = [];

  const SOFT_PEDAL = 67;
  const SUSTAIN_PEDAL = 64;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"
  const ACCENT_BUMP = 1.5;

  const MIDI_NOTE_ON = 0x90; // = the event code (0x90) + channel (0)
  const MIDI_NOTE_OFF = 0x80;
  const MIDI_CONTROL = 0xb0;
  const MIDI_SUSTAIN = 0x40;
  const MIDI_SOFT = 0x43;

  const dispatch = createEventDispatcher();

  const midiSamplePlayer = new MidiPlayer.Player();

  const piano = new Piano({
    url: "samples/",
    velocities: $sampleVelocities,
    release: true,
    pedal: true,
    maxPolyphony: Infinity,
    volume: {
      strings: $sampleVolumes.strings,
      harmonics: $sampleVolumes.harmonics,
      pedal: $sampleVolumes.pedal,
      keybed: $sampleVolumes.keybed,
    },
    reverbWet: $reverbWetDry,
  });

  const pianoReady = piano.load();

  const sendMidiMsg = (msg) => {
    for (let i = 0; i < midiOuts.length; i++) {
      midiOuts[i].send(msg);
    }
  };

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

  const toggleSustain = (onOff, fromMidi) => {
    if (fromMidi) {
      $sustainOnOff = onOff;
      return;
    }
    onOff ? piano.pedalDown() : piano.pedalUp();
    if (midiOuts.length && !fromMidi) {
      sendMidiMsg([MIDI_CONTROL, MIDI_SUSTAIN, (onOff ? 1 : 0) * 127]);
    }
  };

  const toggleSoft = (onOff, fromMidi) => {
    if (fromMidi) {
      $softOnOff = onOff;
      return;
    }
    if (midiOuts.length && !fromMidi) {
      sendMidiMsg([MIDI_CONTROL, MIDI_SOFT, (onOff ? 1 : 0) * 127]);
    }
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
      softOnOff.set(false);
    }

    if (notesMap) {
      activeNotes.reset(notesMap.search($currentTick, $currentTick));
    }
  };

  const updatePlayer = (fn = () => {}) => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      return Promise.resolve(fn()).then(() => {
        setPlayerStateAtTick($currentTick);
        midiSamplePlayer.play();
      });
    }
    return Promise.resolve(fn())
      .then(() => setPlayerStateAtTick($currentTick))
      .catch(() => {});
  };

  const loadSampleVelocities = () => {
    if ($sampleVelocities === piano.loadedVelocities) return;
    updatePlayer(() => {
      const loadingSamples = piano.updateVelocities($sampleVelocities);
      dispatch("loading", loadingSamples);
      // if samples are in the process of being loaded, the promise is
      //  rejected; update the UI to reflect the correct value
      loadingSamples
        .then(() => ($sampleVelocities = piano.loadedVelocities))
        .catch(
          ({ loadedVelocities }) => ($sampleVelocities = loadedVelocities),
        );
      return loadingSamples;
    });
  };

  const updateSampleVelocities = () => {
    if ($sampleVelocities > 4 && $sampleVelocities > piano.loadedVelocities) {
      notify({
        modal: true,
        title: "Please confirm your choice",
        message:
          "Increasing the sample count beyond four will consume large amounts " +
          "of your system's memory, and could result in crashing the browser " +
          "or even the entire system.  If you experience issues, please " +
          "lower the count to four or lower.",
        closable: false,
        actions: [
          {
            label: "okay",
            fn: loadSampleVelocities,
          },
          {
            label: "cancel",
            fn: () => ($sampleVelocities = piano.loadedVelocities),
          },
        ],
      });
      return;
    }
    loadSampleVelocities();
  };

  const startNote = (noteNumber, velocity, fromMidi) => {
    let baseVelocity =
      (($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100;
    [$velocityCurveLow, $velocityCurveMid, $velocityCurveHigh].forEach(
      (keyboardRegion) => {
        if (
          keyboardRegion.velocityCurve !== null &&
          noteNumber >= keyboardRegion.firstMidi &&
          noteNumber <= keyboardRegion.lastMidi
        ) {
          [, baseVelocity] =
            keyboardRegion.velocityCurve[
              parseInt(keyboardRegion.velocityCurve.length * baseVelocity, 10)
            ];
        }
      },
    );
    const modifiedVelocity =
      baseVelocity *
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
    if (midiOuts.length && !fromMidi) {
      sendMidiMsg([
        MIDI_NOTE_ON,
        noteNumber,
        parseInt(modifiedVelocity * 127, 10),
      ]);
    }
  };

  const stopNote = (noteNumber, fromMidi) => {
    piano.keyUp({ midi: noteNumber });
    if (midiOuts.length && !fromMidi) {
      sendMidiMsg([MIDI_NOTE_OFF, noteNumber, 0]);
    }
  };

  const stopAllNotes = () => {
    toggleSustain(false);
    $activeNotes.forEach((midiNumber) => stopNote(midiNumber));
    if ($sustainOnOff) toggleSustain(true);
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

  const registerMidiInputs = (midi) => {
    // Respond to input from attached MIDI controllers
    Array.from(midi.inputs).forEach((input) => {
      if (input[1].onmidimessage !== null) return;
      input[1].onmidimessage = (msg) => {
        if (msg.data.length > 1) {
          if (msg.data[0] == MIDI_CONTROL) {
            if (msg.data[1] == MIDI_SUSTAIN) {
              toggleSustain(!!parseInt(msg.data[2], 10), true);
            } else if (msg.data[1] == MIDI_SOFT) {
              toggleSoft(!!parseInt(msg.data[2], 10), true);
            }
          } else if (msg.data[0] == MIDI_NOTE_ON) {
            if (msg.data[2] === 0) {
              stopNote(msg.data[1], true);
              activeNotes.delete(msg.data[1]);
            } else {
              startNote(
                msg.data[1],
                parseInt((parseFloat(msg.data[2]) / 127.0) * 100.0, 10),
                true,
              );
              activeNotes.add(msg.data[1]);
            }
          } else if (msg.data[0] == MIDI_NOTE_OFF) {
            stopNote(msg.data[1], true);
            activeNotes.delete(msg.data[1]);
          }
        }
      };
    });
  };

  const registerMidiDevices = () => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midi) => {
        registerMidiInputs(midi);
        midiOuts = Array.from(midi.outputs).map((output) => output[1]);
        // This handles when new devices are connected (or disconnected)
        midi.onstatechange = () => {
          registerMidiInputs(midi);
          midiOuts = Array.from(midi.outputs).map((output) => output[1]);
        };
      });
    }
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

    registerMidiDevices();

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
        if (number === SUSTAIN_PEDAL) {
          sustainOnOff.set(!!value);
        } else if (number === SOFT_PEDAL) {
          softOnOff.set(!!value);
        }
      } else if (name === "Set Tempo" && $useMidiTempoEventsOnOff) {
        midiSamplePlayer.setTempo(data * $tempoCoefficient);
      }
    },
  );

  midiSamplePlayer.on("endOfFile", pausePlayback);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: toggleSustain($sustainOnOff);
  $: toggleSoft($softOnOff);
  $: $tempoCoefficient, updatePlayer();
  $: $useMidiTempoEventsOnOff, updatePlayer();
  $: $rollPedalingOnOff, updatePlayer();
  $: piano.updateVolumes($sampleVolumes);
  $: piano.updateReverb($reverbWetDry);
  $: $sampleVelocities, updateSampleVelocities();

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

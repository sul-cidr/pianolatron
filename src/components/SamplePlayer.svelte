<svelte:options accessors />

<script>
  import { tick as sweep } from "svelte";
  import MidiPlayer from "midi-player-js";
  import { createEventDispatcher } from "svelte";
  import { Piano } from "../lib/pianolatron-piano";
  import { notify } from "../ui-components/Notification.svelte";
  import { getPathJoiner, NoteSource, RecordingActions } from "../lib/utils";
  import { rollProfile } from "../config/roll-config";
  import {
    isPlaying,
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
    sustainFromExternalMidi,
    softFromExternalMidi,
    softPedalRatio,
    accentBump,
    sustainProlong,
    useMidiTempoEventsOnOff,
    activeNotes,
    currentTick,
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocityMods,
    transposeHalfStep,
    playRepeat,
    latencyDetected,
    throttledTick,
    ticksPerSecond,
    expressionBox,
  } from "../stores";
  import WebMidi from "./WebMidi.svelte";
  import AudioRecorder from "./AudioRecorder.svelte";

  export let metadata; // This is the metadata from the roll's JSON file

  let webMidi;
  let audioRecorder;
  let recordingDestination;

  let playbackStartTick;
  let playbackStartTime;

  let latencyThreshold = 100;
  let latentNotes = [];

  const VELOCITY_RANGES = {
    p: { low: 0, high: 48 },
    m: { low: 49, high: 80 },
    f: { low: 81, high: 127 },
  };

  // These are the MIDI controller values for these pedal events
  const SOFT_PEDAL = 67;
  const SUSTAIN_PEDAL = 64;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;

  const dispatch = createEventDispatcher();

  const midiSamplePlayer = new MidiPlayer.Player();
  const joinPath = getPathJoiner(import.meta.env.BASE_URL);

  const piano = new Piano({
    url: joinPath("samples/"),
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

  recordingDestination = piano.context.createMediaStreamDestination();
  piano.connect(recordingDestination);

  const setTempo = (tempo) => {
    midiSamplePlayer.setTempo(tempo * $tempoCoefficient);
    $ticksPerSecond = (midiSamplePlayer.division * midiSamplePlayer.tempo) / 60;
  };

  const getTempoAtTick = (tick) => {
    if (!$useMidiTempoEventsOnOff) return DEFAULT_TEMPO;
    const { tempoMap } = $expressionBox;
    return tempoMap.search(tick, tick)[0] || DEFAULT_TEMPO;
  };

  const setPlayerStateAtTick = (tick = $currentTick) => {
    const { pedalingMap, notesMap, midiSoftPedal, midiSustPedal } =
      $expressionBox;
    if (midiSamplePlayer.tracks[0])
      midiSamplePlayer.tracks[0].enabled = $useMidiTempoEventsOnOff;
    setTempo(getTempoAtTick(tick));

    playbackStartTick = $currentTick;
    playbackStartTime = Date.now();

    if (pedalingMap && $rollPedalingOnOff) {
      const pedals = pedalingMap.search($currentTick, $currentTick);
      sustainOnOff.set(pedals.includes(midiSustPedal));
      softOnOff.set(pedals.includes(midiSoftPedal));
    } else {
      sustainOnOff.set(false);
      softOnOff.set(false);
    }

    if (notesMap) {
      activeNotes.reset(notesMap.search($currentTick, $currentTick));
    }
  };

  const stopNote = (noteNumber, noteSource, timeDelay, tick) => {
    const finalNoteNumber =
      noteSource === NoteSource.Midi
        ? noteNumber + $transposeHalfStep
        : noteNumber;
    activeNotes.delete(finalNoteNumber);
    if (timeDelay !== undefined)
      piano.keyUp({ midi: finalNoteNumber, time: timeDelay });
    else piano.keyUp({ midi: finalNoteNumber });
    if (noteSource !== NoteSource.WebMidi) {
      webMidi?.sendMidiMsg("NOTE_OFF", finalNoteNumber, 0, tick);
    }
  };

  const stopAllNotes = () => {
    piano.pedalUp();
    $activeNotes.forEach((midiNumber) => stopNote(midiNumber));
    if ($sustainOnOff) piano.pedalDown();
  };

  const pausePlayback = () => {
    midiSamplePlayer.pause();
    midiSamplePlayer.triggerPlayerEvent("pause");
    stopAllNotes();
    webMidi?.sendMidiMsg("CONTROLLER", "SUSTAIN", false);
    webMidi?.sendMidiMsg("CONTROLLER", "SOFT", false);
    $isPlaying = false;
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

  const toggleSustain = (onOff, fromMidi) => {
    if (onOff) {
      piano.pedalDown();
    } else {
      piano.pedalUp({ time: `+${$sustainProlong / 1000}s` });
    }
    if (fromMidi && $sustainFromExternalMidi) {
      $sustainOnOff = onOff;
    } else if (!fromMidi && !$sustainFromExternalMidi) {
      webMidi?.sendMidiMsg("CONTROLLER", "SUSTAIN", onOff);
    }
  };

  const toggleSoft = (onOff, fromMidi) => {
    if (fromMidi && $softFromExternalMidi) {
      $softOnOff = onOff;
    } else if (!fromMidi && !$softFromExternalMidi) {
      webMidi?.sendMidiMsg("CONTROLLER", "SOFT", onOff);
    }
  };

  // Note this is somewhat redundant with convertTicksAndTime() in
  //  in-app-expressionizer.js
  const getElapsedTimeAtTick = (tick) => {
    let thisTempo = DEFAULT_TEMPO;
    let elapsedTime = 0.0;
    let lastTick = 0;
    let ticksPerSecond = 0;
    let ticksAtLastTempo = 0;

    const { tempoMap } = $expressionBox;

    const intervals = Array.from(tempoMap.inOrder());

    Object.values(intervals).every((interval) => {
      thisTempo = interval.data;

      ticksPerSecond =
        (thisTempo * $tempoCoefficient * midiSamplePlayer.division) / 60.0;

      if (interval.high > tick) {
        ticksAtLastTempo = tick - lastTick;
        elapsedTime += (ticksAtLastTempo / ticksPerSecond) * 1000;
        return false;
      }
      ticksAtLastTempo = parseFloat(interval.high - interval.low);

      elapsedTime += (ticksAtLastTempo / ticksPerSecond) * 1000;
      lastTick = interval.high;
      return true;
    });

    return elapsedTime;
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
    if ($sampleVelocities > 8 && $sampleVelocities > piano.loadedVelocities) {
      notify({
        modal: true,
        title: "Please confirm your choice",
        message:
          "Increasing the sample count beyond eight will consume large amounts " +
          "of your system's memory, and could result in crashing the browser " +
          "or even the entire system. If you experience issues, please " +
          "lower the count to eight or lower.",
        closable: false,
        type: "dialog",
        actions: [
          {
            label: "OK",
            fn: loadSampleVelocities,
          },
          {
            label: "Cancel",
            fn: () => ($sampleVelocities = piano.loadedVelocities),
          },
        ],
      });
      return;
    }
    loadSampleVelocities();
  };

  const applyVelocityMods = (keyboardRegion, velocity, regionLabel) => {
    for (const [dynamic, limits] of Object.entries(VELOCITY_RANGES)) {
      const midiVelocity = velocity * 127.0;
      if (midiVelocity >= limits.low && midiVelocity <= limits.high)
        return (
          (midiVelocity * parseFloat(keyboardRegion.mods[dynamic])) / 127.0
        );
    }
    return velocity;
  };

  const startNote = (noteNumber, velocity, noteSource, tick) => {
    const finalNoteNumber =
      noteSource === NoteSource.Midi
        ? noteNumber + $transposeHalfStep
        : noteNumber;
    activeNotes.add(finalNoteNumber);
    let baseVelocity =
      (($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100;
    Object.entries($velocityMods).forEach(([regionLabel, keyboardRegion]) => {
      if (
        finalNoteNumber >= keyboardRegion.firstMidi &&
        finalNoteNumber <= keyboardRegion.lastMidi
      ) {
        baseVelocity = applyVelocityMods(
          keyboardRegion,
          baseVelocity,
          regionLabel,
        );
      }
    });
    // Note: $softPedalRatio is only applied when calling piano.keyDown() as
    //       @tonejs/piano has so built-in soft pedaling and so we emulate in
    //       software.  For WebMIDI outputs we send soft pedal controller
    //       events and note velocities that are not modified for softness.
    const modifiedVelocity = Math.min(
      baseVelocity *
        (($accentOnOff && $accentBump) || 1) *
        $volumeCoefficient *
        (finalNoteNumber < rollProfile[$rollMetadata.ROLL_TYPE].trebleNotesBegin
          ? $bassVolumeCoefficient
          : $trebleVolumeCoefficient),
      1,
    );
    // For note play events, check whether they're lagging the expected timings
    if (modifiedVelocity) {
      const { notesMap } = $expressionBox;
      if (notesMap.search(tick, tick).includes(noteNumber)) {
        const thisTime = Date.now();
        const elapsedTime = (thisTime - playbackStartTime) / 1000;
        const expectedElapsedTime =
          (getElapsedTimeAtTick(tick) -
            getElapsedTimeAtTick(playbackStartTick)) /
          1000;
        const elapsedTimeDiff = elapsedTime - expectedElapsedTime;
        latencyThreshold =
          (midiSamplePlayer.division * midiSamplePlayer.tempo) / 600;
        if (elapsedTimeDiff > 0.1) {
          latentNotes = [...latentNotes, tick];
        } else if ($latencyDetected) {
          latentNotes = latentNotes.filter(
            (n) => n >= $currentTick - latencyThreshold,
          );
        }
      }
      piano.keyDown({
        midi: finalNoteNumber,
        velocity: modifiedVelocity * (($softOnOff && $softPedalRatio) || 1),
      });
    }
    if (noteSource !== NoteSource.WebMidi) {
      webMidi?.sendMidiMsg("NOTE_ON", finalNoteNumber, modifiedVelocity, tick);
    }
  };

  const resetPlayback = () => {
    currentTick.reset();
    throttledTick.set(0);
    midiSamplePlayer.stop();
    activeNotes.reset();
    softOnOff.reset();
    sustainOnOff.reset();
    accentOnOff.reset();
    $isPlaying = false;
  };

  const startPlayback = () => {
    if ($currentTick < 0 || $currentTick >= midiSamplePlayer.totalTicks)
      resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
    $isPlaying = true;
  };

  const stopPlaybackOrLoop = async () => {
    resetPlayback();
    if ($playRepeat) {
      // the midiplayer resets some things when it hits endOfFile.
      // Let it reset, then restart.
      await sweep();
      startPlayback();
    }
  };

  midiSamplePlayer.on("fileLoaded", () => {
    const decodeHtmlEntities = (string) =>
      string
        .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
        .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
          String.fromCodePoint(parseInt(num, 16)),
        );

    const [metadataTrack] = midiSamplePlayer.events;

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

    $ticksPerSecond = 0;

    // If a note is lagging its expected play time by > .1s, it is added to the
    //  list of latent notes. When 10 of these are counted within .1s, the
    //  warning message is triggered.
    latencyThreshold = (midiSamplePlayer.division * DEFAULT_TEMPO) / 600;
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (!$isPlaying) $isPlaying = true;
    if (tick <= midiSamplePlayer.totalTicks) {
      currentTick.set(tick);
      throttledTick.set(tick);
    }
    if (tick >= midiSamplePlayer.totalTicks) $isPlaying = false;
  });

  midiSamplePlayer.on("pause", () => ($isPlaying = false));
  midiSamplePlayer.on("stop", () => ($isPlaying = false));

  const handleMidiEvent = ({
    name,
    value,
    number,
    noteNumber,
    velocity,
    data,
    tick,
  }) => {
    if (name === "Note on") {
      if (velocity === 0) {
        stopNote(noteNumber, NoteSource.Midi, 0, tick);
      } else {
        startNote(noteNumber, velocity, NoteSource.Midi, tick);
      }
    } else if (name === "Controller Change" && $rollPedalingOnOff) {
      if (number === SUSTAIN_PEDAL) {
        sustainOnOff.set(!!value);
      } else if (number === SOFT_PEDAL) {
        softOnOff.set(!!value);
      }
    } else if (name === "Set Tempo" && $useMidiTempoEventsOnOff) {
      setTempo(data);
    }
  };

  midiSamplePlayer.on("midiEvent", handleMidiEvent);

  const recordingControl = (action) => {
    switch (action) {
      case RecordingActions.Clear:
        webMidi?.clearRecording();
        audioRecorder?.clearRecording();
        break;
      case RecordingActions.ExportMIDI:
        webMidi?.exportRecording();
        break;
      case RecordingActions.ExportWAV:
        audioRecorder?.exportRecording();
        break;
      default:
    }
  };

  const updateTranspose = () => {
    // if we're playing just dump everything and let the updates roll in
    if ($isPlaying) {
      stopAllNotes();
    }
  };

  const checkLatency = () => ($latencyDetected = latentNotes.length > 10);

  const exportInAppMIDI = () => {
    webMidi?.exportInAppMIDI();
  };

  midiSamplePlayer.on("endOfFile", stopPlaybackOrLoop);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: toggleSustain($sustainOnOff);
  $: toggleSoft($softOnOff);
  $: ($tempoCoefficient, updatePlayer());
  $: ($useMidiTempoEventsOnOff, updatePlayer());
  $: ($rollPedalingOnOff, updatePlayer());
  $: piano.updateVolumes($sampleVolumes);
  $: piano.updateReverb($reverbWetDry);
  $: ($sampleVelocities, updateSampleVelocities());
  $: ($transposeHalfStep, updateTranspose());
  $: (latentNotes, checkLatency());

  export {
    midiSamplePlayer,
    pianoReady,
    updatePlayer,
    startNote,
    stopNote,
    pausePlayback,
    startPlayback,
    resetPlayback,
    recordingControl,
    exportInAppMIDI,
  };
</script>

<WebMidi
  bind:this={webMidi}
  {metadata}
  {startNote}
  {stopNote}
  {toggleSustain}
  {toggleSoft}
/>

<AudioRecorder bind:this={audioRecorder} {recordingDestination} />

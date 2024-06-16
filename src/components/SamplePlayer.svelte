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
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
    transposeHalfStep,
    playRepeat,
    playbackProgressStart,
    latencyDetected,
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

  let latencyThreshold = 1000;
  let latentNotes = [];

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

  const skipToTick = (tick) => {
    if (tick < 0) pausePlayback();
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  const skipToPercentage = (percentage = 0) =>
    skipToTick(Math.floor(midiSamplePlayer.totalTicks * percentage));

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

  const getElapsedTimeAtTick = (tick) => {
    let prevTempo = null;
    let prevTemposTick;

    let thisTick = 0;
    let thisTempo = DEFAULT_TEMPO;

    let elapsedTime = 0;
    let i = 0;

    const { tempoMap } = $expressionBox;

    while (tempoMap[i][0] <= tick) {
      [thisTick, thisTempo] = tempoMap[i];

      if (prevTempo === null) {
        prevTempo = thisTempo;
        prevTemposTick = thisTick;
      } else {
        if (thisTempo !== prevTempo) {
          const thisTickPerSec =
            (prevTempo * $tempoCoefficient * midiSamplePlayer.division) / 60.0;
          elapsedTime += (1 / thisTickPerSec) * (thisTick - 1 - prevTemposTick);
          prevTempo = thisTempo;
          prevTemposTick = thisTick;
        }

        i += 1;
        if (i >= tempoMap.length) break;
      }
    }

    const thisTickPerSec =
      (prevTempo * $tempoCoefficient * midiSamplePlayer.division) / 60.0;

    elapsedTime += (1 / thisTickPerSec) * (tick - prevTemposTick);
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

  const startNote = (noteNumber, velocity, noteSource, tick) => {
    const finalNoteNumber =
      noteSource === NoteSource.Midi
        ? noteNumber + $transposeHalfStep
        : noteNumber;
    activeNotes.add(finalNoteNumber);
    let baseVelocity =
      (($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100;
    [$velocityCurveLow, $velocityCurveMid, $velocityCurveHigh].forEach(
      (keyboardRegion) => {
        if (
          keyboardRegion.velocityCurve !== null &&
          finalNoteNumber >= keyboardRegion.firstMidi &&
          finalNoteNumber <= keyboardRegion.lastMidi
        ) {
          [, baseVelocity] =
            keyboardRegion.velocityCurve[
              parseInt(keyboardRegion.velocityCurve.length * baseVelocity, 10)
            ];
        }
      },
    );
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
    if (modifiedVelocity) {
      const { notesMap } = $expressionBox;
      if (notesMap.search(tick, tick).includes(noteNumber)) {
        const thisTime = Date.now();
        const elapsedTime = (thisTime - playbackStartTime) / 1000;
        const expectedElapsedTime =
          getElapsedTimeAtTick(tick) - getElapsedTimeAtTick(playbackStartTick);
        const elapsedTimeDiff = elapsedTime - expectedElapsedTime;
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
    midiSamplePlayer.stop();
    activeNotes.reset();
    softOnOff.reset();
    sustainOnOff.reset();
    accentOnOff.reset();
    $isPlaying = false;
  };

  const startPlayback = () => {
    if ($currentTick < 0) resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
    $isPlaying = true;
  };

  const pausePlaybackOrLoop = async () => {
    pausePlayback();
    if ($playRepeat) {
      // the midiplayer resets some things when it hits endOfFile.
      // Let it reset, then go to the start point and restart.
      await sweep();
      skipToPercentage($playbackProgressStart);
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

    latencyThreshold = Math.floor(midiSamplePlayer.totalTicks * 0.1);
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (!$isPlaying) $isPlaying = true;
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
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
        audioRecorder.clearRecording();
        break;
      case RecordingActions.ExportMIDI:
        webMidi?.exportRecording();
        break;
      case RecordingActions.ExportWAV:
        audioRecorder.exportRecording();
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

  const checkLatency = () => {
    if (latentNotes.length > 10) {
      $latencyDetected = true;
    } else {
      $latencyDetected = false;
    }
  };

  const exportInAppMIDI = () => {
    webMidi?.exportInAppMIDI();
  };

  midiSamplePlayer.on("endOfFile", pausePlaybackOrLoop);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: toggleSustain($sustainOnOff);
  $: toggleSoft($softOnOff);
  $: $tempoCoefficient, updatePlayer();
  $: $useMidiTempoEventsOnOff, updatePlayer();
  $: $rollPedalingOnOff, updatePlayer();
  $: piano.updateVolumes($sampleVolumes);
  $: piano.updateReverb($reverbWetDry);
  $: $sampleVelocities, updateSampleVelocities();
  $: $transposeHalfStep, updateTranspose();
  $: latentNotes, checkLatency();

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

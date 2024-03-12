<script>
  import { tick as sweep } from "svelte";
  import MidiPlayer from "midi-player-js";
  import IntervalTree from "node-interval-tree";
  import { createEventDispatcher } from "svelte";
  import { Piano } from "../lib/pianolatron-piano";
  import { notify } from "../ui-components/Notification.svelte";
  import { getPathJoiner, NoteSource, RecordingActions } from "../lib/utils";
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
    useMidiTempoEventsOnOff,
    activeNotes,
    currentTick,
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
    userSettings,
    transposeHalfStep,
    playRepeat,
    playbackProgressStart,
    latencyDetected,
    ticksPerSecond,
  } from "../stores";
  import WebMidi from "./WebMidi.svelte";
  import AudioRecorder from "./AudioRecorder.svelte";

  let webMidi;
  let audioRecorder;
  let recordingDestination;

  let tempoMap;
  let pedalingMap;
  let notesMap;

  let playbackStartTick;
  let playbackStartTime;

  let latencyThreshold = 1000;
  let latentNotes = [];

  const SOFT_PEDAL = 67;
  const SUSTAIN_PEDAL = 64;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"
  const ACCENT_BUMP = 1.5;

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

  const skipToTick = (tick) => {
    if (tick < 0) pausePlayback();
    $currentTick = tick;
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  const skipToPercentage = (percentage = 0) =>
    skipToTick(Math.floor(midiSamplePlayer.totalTicks * percentage));

  const getTempoAtTick = (tick) => {
    if (!tempoMap || !$useMidiTempoEventsOnOff) return DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
      [, tempo] = tempoMap[i];
      i += 1;
      if (i >= tempoMap.length) break;
    }
    return tempo || DEFAULT_TEMPO;
  };

  const toggleSustain = (onOff, fromMidi) => {
    if (onOff) {
      piano.pedalDown();
    } else {
      piano.pedalUp();
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

    while (tempoMap[i][0] <= tick) {
      [thisTick, thisTempo] = tempoMap[i];

      if (prevTempo === null) {
        prevTempo = thisTempo;
        prevTemposTick = thisTick;
        continue;
      }

      if (thisTempo != prevTempo) {
        let thisTickPerSec =
          (prevTempo * $tempoCoefficient * midiSamplePlayer.division) / 60.0;
        elapsedTime += (1 / thisTickPerSec) * (thisTick - 1 - prevTemposTick);
        prevTempo = thisTempo;
        prevTemposTick = thisTick;
      }

      i += 1;
      if (i >= tempoMap.length) break;
    }

    let thisTickPerSec =
      (prevTempo * $tempoCoefficient * midiSamplePlayer.division) / 60.0;

    elapsedTime += (1 / thisTickPerSec) * (tick - prevTemposTick);
    return elapsedTime;
  };

  const setTempo = (tempo) => {
    midiSamplePlayer.setTempo(tempo * $tempoCoefficient);
    $ticksPerSecond = (midiSamplePlayer.division * midiSamplePlayer.tempo) / 60;
  };

  const setPlayerStateAtTick = (tick = $currentTick) => {
    if (midiSamplePlayer.tracks[0])
      midiSamplePlayer.tracks[0].enabled = $useMidiTempoEventsOnOff;
    setTempo(getTempoAtTick(tick));

    playbackStartTick = $currentTick;
    playbackStartTime = Date.now();

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

  const startNote = (noteNumber, velocity, noteSource, tick) => {
    if (noteSource == NoteSource.Midi) {
      noteNumber = noteNumber + $transposeHalfStep;
    }
    activeNotes.add(noteNumber);
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
    // Note: SOFT_PEDAL_RATIO is only applied when calling piano.keyDown() as
    //       @tonejs/piano has so built-in soft pedaling and so we emulate in
    //       software.  For WebMIDI outputs we send soft pedal controller
    //       events and note velocities that are not modified for softness.
    const modifiedVelocity = Math.min(
      baseVelocity *
        (($accentOnOff && ACCENT_BUMP) || 1) *
        $volumeCoefficient *
        (noteNumber < HALF_BOUNDARY
          ? $bassVolumeCoefficient
          : $trebleVolumeCoefficient),
      1,
    );
    if (modifiedVelocity) {
      if (
        notesMap.search(tick, tick).includes(noteNumber - $transposeHalfStep)
      ) {
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
        midi: noteNumber,
        velocity: modifiedVelocity * (($softOnOff && SOFT_PEDAL_RATIO) || 1),
      });
    }
    if (noteSource != NoteSource.WebMidi) {
      webMidi?.sendMidiMsg("NOTE_ON", noteNumber, modifiedVelocity);
    }
  };

  const stopNote = (noteNumber, noteSource) => {
    if (noteSource == NoteSource.Midi) {
      noteNumber = noteNumber + $transposeHalfStep;
    }
    activeNotes.delete(noteNumber);
    piano.keyUp({ midi: noteNumber });
    if (noteSource != NoteSource.WebMidi) {
      webMidi?.sendMidiMsg("NOTE_OFF", noteNumber, 0);
    }
  };

  const stopAllNotes = () => {
    piano.pedalUp();
    $activeNotes.forEach((midiNumber) => stopNote(midiNumber));
    if ($sustainOnOff) piano.pedalDown();
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

  const pausePlayback = () => {
    midiSamplePlayer.pause();
    midiSamplePlayer.triggerPlayerEvent("pause");
    stopAllNotes();
    $isPlaying = false;
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

  const startPlayback = () => {
    if ($currentTick < 0) resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
    $isPlaying = true;
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

    $ticksPerSecond = 0;
    tempoMap = buildTempoMap(metadataTrack);
    // where two or more "music tracks" exist, pedal events are expected to have
    //  been duplicated across tracks, so we read only from the first one.
    pedalingMap = buildPedalingMap(musicTracks[0]);

    notesMap = buildNotesMap(musicTracks);

    latencyThreshold = Math.floor(midiSamplePlayer.totalTicks * 0.1);
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (!$isPlaying) $isPlaying = true;
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
  });

  midiSamplePlayer.on("pause", () => ($isPlaying = false));
  midiSamplePlayer.on("stop", () => ($isPlaying = false));

  midiSamplePlayer.on(
    "midiEvent",
    ({ name, value, number, noteNumber, velocity, data, tick }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          stopNote(noteNumber, NoteSource.Midi);
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
    },
  );

  midiSamplePlayer.on("endOfFile", pausePlaybackOrLoop);

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
        console.log("Unknown recording action: " + action);
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
    skipToTick,
    skipToPercentage,
  };
</script>

{#if $userSettings.useWebMidi}
  <WebMidi
    bind:this={webMidi}
    {startNote}
    {stopNote}
    {toggleSustain}
    {toggleSoft}
    {recordingDestination}
  />
{/if}

<AudioRecorder bind:this={audioRecorder} {recordingDestination} />

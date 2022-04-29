import IntervalTree from "node-interval-tree";
import { get } from "svelte/store";
import { rollMetadata } from "../stores";
import {
  activeNotes,
  rollPedalingOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
  playExpressionsOnOff,
  bassExpCurve,
  trebleExpCurve,
  expressionParameters,
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { getHoleType } from "../lib/utils";

const DEFAULT_TEMPO = 60;

const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

const getTempoAtTick = (tick, tempoMap) => {
  if (!tempoMap || !get(useMidiTempoEventsOnOff)) return DEFAULT_TEMPO;
  let tempo;
  let i = 0;
  while (tempoMap[i][0] <= tick) {
    [, tempo] = tempoMap[i];
    i += 1;
    if (i >= tempoMap.length) break;
  }
  return tempo;
};

const getExpressionParams = (rollType) => {
  let expParams = null;
  if (rollType === "88-note") {
    expParams = {
      default_mf: 75,
      accent_f: 95, // snakebite velocity
      snakebite_extension: 200, // extension (in ms) before and after snakebite
      trackerbar_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_extension_fraction: 0.75,
      accelFtPerMin2: 0.2,
    };
    expParams.tracker_extension = parseInt(
      expParams.trackerbar_diameter * expParams.punch_extension_fraction,
      10,
    );
  }
  return expParams;
};

const getExpressionStateBox = (rollType) => {
  let expState = null;
  if (rollType === "88-note") {
    expState = {
      velocity: 0, // Velocity at last expression event
      time: 0.0, // Time (in ms) at last expression event
      snakebite_start: null,
      snakebite_stop: null, // Can be in the future due to tracker extension
    };
  }
  return expState;
};

const getVelocityAtTime = (time, expState, expParams) => {
  // XXX This probably can be simplified -- really need to check all the nulls?
  const isSnakebiteOn =
    (expState.snakebite_start !== null && expState.snakebite_stop === null) ||
    (expState.snakebite_start !== null &&
      expState.snakebite_stop !== null &&
      expState.snakebite_stop > time);

  return isSnakebiteOn ? expParams.accent_f : expParams.default_mf;
};

const buildNoteVelocitiesMap = (midiSamplePlayer, tempoMap) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const midiTPQ = midiSamplePlayer.getDivision().division;

  const convertTicksAndTime = (input, target) => {
    let wanted = target;
    if (wanted == null) wanted = "time";

    if (!tempoMap || !get(useMidiTempoEventsOnOff)) {
      if (wanted === "time") {
        return (parseFloat(input) / midiTPQ) * 1000;
      }
      if (wanted === "tick") {
        return parseInt((input * midiTPQ) / 1000, 10);
      }
    }

    let lastTime = 0.0;
    let lastTick = 0;
    let lastTempo = DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (
      (wanted === "time" && lastTick <= input) ||
      (wanted === "tick" && lastTime <= input)
    ) {
      [, tempo] = tempoMap[i];
      if (i !== 0) {
        const lastTicksPerSecond = (parseFloat(lastTempo) * midiTPQ) / 60.0;
        const ticksAtLastTempo = parseFloat(tempoMap[i][0] - lastTick);
        const timeAtLastTempo = (ticksAtLastTempo / lastTicksPerSecond) * 1000;
        lastTime += timeAtLastTempo;
      }
      lastTempo = tempo;
      [lastTick] = tempoMap[i];
      i += 1;
      if (i >= tempoMap.length) break;
    }

    const lastTicksPerSecond = (parseFloat(lastTempo) * midiTPQ) / 60.0;

    if (wanted === "tick") {
      const timeAtLastTempo = input - lastTime;
      const ticksAtLastTempo = parseInt(
        (timeAtLastTempo * lastTicksPerSecond) / 1000,
        10,
      );
      lastTick += ticksAtLastTempo;
      return lastTick;
    }
    if (wanted === "time") {
      const ticksAtLastTempo = parseFloat(input - lastTick);
      const timeAtLastTempo = (ticksAtLastTempo / lastTicksPerSecond) * 1000;
      lastTime += timeAtLastTempo;
      return lastTime;
    }
    return null;
  };

  const [, ...musicTracks] = midiSamplePlayer.events;

  const expParams = getExpressionParams(rollType);

  expressionParameters.set(expParams);

  const _expressionMap = {};

  const buildPanExpMap = (
    noteTrackMsgs,
    ctrlTrackMsgs,
    adjust,
    bassOrTreble,
  ) => {
    const expState = getExpressionStateBox(rollType);

    expState.velocity = expParams.default_mf;

    const expressionCurve = [];

    const panMsgs = ctrlTrackMsgs
      .filter(({ name }) => name === "Note on")
      .concat(
        noteTrackMsgs.filter(
          ({ name, velocity }) => name === "Note on" && !!velocity,
        ),
      )
      .sort((a, b) => (a.tick > b.tick ? 1 : -1));

    panMsgs.forEach(({ noteNumber: midiNumber, velocity, tick }) => {
      const tempo = getTempoAtTick(tick, tempoMap);
      const ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;

      // This is needed to handle expressions that cross tempo changes
      const msgTime = convertTicksAndTime(tick);

      const holeType = getHoleType({ m: midiNumber }, rollType);

      if (holeType === "note") {
        // Only apply adjustment (if at all) on the external (played)
        // velocities, not the interally stored/computed expressions
        const noteVelocity =
          getVelocityAtTime(msgTime, expState, expParams) + adjust;

        if (tick in _expressionMap) {
          _expressionMap[tick][midiNumber] = noteVelocity;
        } else {
          _expressionMap[tick] = {};
          _expressionMap[tick][midiNumber] = noteVelocity;
        }
      } else if (holeType === "control") {
        const ctrlFunc = rollProfile[rollType].ctrlMap[midiNumber];
        if (ctrlFunc == null) return; // Usually these are damage holes

        const panVelocity = getVelocityAtTime(msgTime, expState, expParams);
        const trackerExtensionSeconds =
          expParams.tracker_extension / ticksPerSecond;
        if (ctrlFunc === "acc") {
          // Snakebite accents tend to be doubled -- do anything about this?
          if (velocity > 0) {
            expState.snakebite_start = Math.max(
              0,
              msgTime - expParams.snakebite_extension,
            );
            // Snakebite accents can affect note holes that begin *before* they
            // do (ugh) so need to adjust the expressionMap values for the
            // notes in that range, on this side of the keyboard only
            const snakebiteExtensionStartTick = convertTicksAndTime(
              expState.snakebite_start,
              "tick",
            );
            const snakebiteExtensionEndTick = convertTicksAndTime(
              msgTime,
              "tick",
            );
            Object.keys(_expressionMap)
              .filter(
                (expTick) =>
                  expTick >= snakebiteExtensionStartTick &&
                  expTick <= snakebiteExtensionEndTick,
              )
              .forEach((noteTick) =>
                Object.keys(_expressionMap[noteTick]).forEach((noteNumber) => {
                  if (
                    (noteNumber < rollProfile[rollType].trebleNotesBegin &&
                      bassOrTreble === "bass") ||
                    (noteNumber >= rollProfile[rollType].trebleNotesBegin &&
                      bassOrTreble === "treble")
                  ) {
                    _expressionMap[noteTick][noteNumber] = expParams.accent_f;
                  }
                }),
              );
            expressionCurve.push([
              snakebiteExtensionStartTick,
              expParams.default_mf,
              expState.snakebite_start,
            ]);
            expressionCurve.push([
              snakebiteExtensionStartTick,
              expParams.accent_f,
              expState.snakebite_start,
            ]);
            expState.snakebite_stop = null;
          } else {
            expState.snakebite_stop =
              msgTime +
              trackerExtensionSeconds * 1000.0 +
              expParams.snakebite_extension;

            const snakebiteExtensionEndTick = convertTicksAndTime(
              expState.snakebite_stop,
              "tick",
            );

            expressionCurve.push([
              snakebiteExtensionEndTick + expParams.tracker_extension,
              expParams.accent_f,
              msgTime,
            ]);

            expressionCurve.push([
              snakebiteExtensionEndTick + expParams.tracker_extension,
              expParams.default_mf,
              msgTime,
            ]);
          }
        }

        expState.time = msgTime;
        expState.velocity = panVelocity;
      }
    });
    return expressionCurve;
  };

  // bass notes and control holes
  bassExpCurve.set(buildPanExpMap(musicTracks[0], musicTracks[2], 0, "bass"));

  // treble notes and control holes
  trebleExpCurve.set(
    buildPanExpMap(musicTracks[1], musicTracks[3], 0, "treble"),
  );

  return _expressionMap;
};

// Note MIDI files usually don't include simulated acceleration via tempo
// events, but theoretically they can. Use those events, or just compute
// everything manually here? Going with the latter for now.
const buildTempoMap = () => {
  const _tempoMap = [];
  const midiTPQ = get(rollMetadata).TICKS_PER_QUARTER;

  const expParams = getExpressionParams(get(rollMetadata).ROLL_TYPE);

  const lengthPPI = 300; // Could get scan PPI from MIDI/metadata
  const ticksPerFt = lengthPPI * 12.0;
  let tempo = DEFAULT_TEMPO; // This probably should be an exp param, too
  const minuteDiv = 0.1; // how often the tempo is updated, could be param
  const startSpeed = (midiTPQ * tempo) / ticksPerFt;
  let speed = startSpeed;
  let minute = 0.0;
  let tick = 0;

  // The acceleration emulation *could* begin at the very start of the roll
  // (well above the first hole), but let's just assume that the roll reaches
  // the default tempo right at the first hole.
  _tempoMap.push([tick, tempo]);
  while (tick < get(rollMetadata).IMAGE_LENGTH - get(rollMetadata).FIRST_HOLE) {
    minute += minuteDiv;
    tick += parseInt(speed * minuteDiv * ticksPerFt, 10);
    speed = startSpeed + minute * expParams.accelFtPerMin2;
    tempo = (speed * ticksPerFt) / midiTPQ;
    _tempoMap.push([tick, tempo]);
  }

  return _tempoMap;
};

/*
 * Builds a map of pedal events, where each key is the tick of the event, and
 * the value is an object with keys of the pedal on and off events.
 *
 */

// Get pedal events from track 0 (bass control = soft pedal) and
// track 1 (treble control = sustain pedal)
const buildPedalingMap = (musicTracks) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];

  const SUSTAIN_PEDAL = getKeyByValue(ctrlMap, "sust");
  const _pedalingMap = new IntervalTree();

  // For 65-note rolls, or any weird MIDI input file with only 1 note track
  if (musicTracks.length === 1) return _pedalingMap;

  const registerPedalEvents = (track, pedalOn) => {
    let tickOn = false;
    track
      // Pedal is on as long as the punch is present
      .filter(({ name }) => name === "Note on")
      .forEach(({ noteNumber, tick, velocity }) => {
        if (noteNumber === pedalOn) {
          if (velocity === 0) {
            if (tickOn) _pedalingMap.insert(tickOn, tick, pedalOn);
            tickOn = false;
          } else if (velocity === 1) {
            if (!tickOn) tickOn = tick;
          }
        }
      });
  };

  registerPedalEvents(musicTracks[2], SUSTAIN_PEDAL);

  return _pedalingMap;
};

const buildNotesMap = (musicTracks) => {
  const _notesMap = new IntervalTree();
  const rollType = get(rollMetadata).ROLL_TYPE;

  const registerNoteEvents = (track) => {
    const tickOn = {};
    track
      // The beginning of a note has velocity=1, end is velocity=0
      .filter(
        ({ name, noteNumber }) =>
          name === "Note on" &&
          getHoleType({ m: noteNumber }, rollType) === "note",
      )
      .forEach(({ noteNumber, velocity, tick }) => {
        if (velocity === 0) {
          if (noteNumber in tickOn) {
            _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
            delete tickOn[noteNumber];
          }
        } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
      });
  };

  registerNoteEvents(musicTracks[0]);
  registerNoteEvents(musicTracks[1]);

  return _notesMap;
};

const buildMidiEventHandler = (
  startNote,
  stopNote,
  noteVelocitiesMap,
  midiSamplePlayer,
  tempoMap,
) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];
  const expParams = getExpressionParams(rollType);

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const midiTPQ = midiSamplePlayer.getDivision().division;

  return ({ name: msgType, noteNumber: midiNumber, velocity, data, tick }) => {
    const tempo = getTempoAtTick(tick, tempoMap);
    // Note MIDI files won't have embedded tempo events. Need to check tempoMap
    // which should include tempo events to emulate roll acceleration.
    const playerTempo = tempo * get(tempoCoefficient);
    if (midiSamplePlayer.tempo !== playerTempo) {
      midiSamplePlayer.pause();
      midiSamplePlayer.setTempo(playerTempo);
      midiSamplePlayer.play();
    }
    if (msgType === "Note on") {
      const holeType = getHoleType({ m: midiNumber }, rollType);
      if (holeType === "note") {
        if (velocity === 0) {
          const ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;
          // At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to accel
          const trackerExtensionSeconds =
            expParams.tracker_extension / ticksPerSecond;
          stopNote(midiNumber, `+${trackerExtensionSeconds}`);
          activeNotes.delete(midiNumber);
        } else {
          const noteVelocity =
            get(playExpressionsOnOff) && noteVelocitiesMap !== null
              ? noteVelocitiesMap[tick][midiNumber]
              : DEFAULT_NOTE_VELOCITY;
          startNote(midiNumber, noteVelocity);
          activeNotes.add(midiNumber);
        }
      } else if (holeType === "pedal" && get(rollPedalingOnOff)) {
        if (ctrlMap[midiNumber] === "sust") {
          sustainOnOff.set(!!velocity);
        }
      }
    } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      // XXX Recalculate expressions when user changes the tempo coefficient?
      const newTempo = data * get(tempoCoefficient);
      midiSamplePlayer.setTempo(newTempo);
    }
  };
};

export {
  buildTempoMap,
  buildPedalingMap,
  buildNotesMap,
  buildNoteVelocitiesMap,
  buildMidiEventHandler,
};

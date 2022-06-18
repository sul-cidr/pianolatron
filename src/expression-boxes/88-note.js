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
  noteVelocitiesMap,
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { getHoleType } from "../lib/utils";

const DEFAULT_TEMPO = 60;
const DEFAULT_NOTE_VELOCITY = 50;

// Pedal event codes are identical for all expression boxes (because they are
// read by the MIDI sample player), so definitely should be superclassed.
const SUSTAIN_PEDAL_MIDI = 64;

const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

const getTempoAtTick = (tick, tempoMap) =>
  !tempoMap || !get(useMidiTempoEventsOnOff)
    ? DEFAULT_TEMPO
    : tempoMap.search(tick, tick)[0];

const getExpressionParams = () => {
  let expParams = null;
  expParams = {
    tunable: {
      default_mf: 75,
      accent_f: 95, // snakebite velocity
      snakebite_extension: 200, // extension (in ms) before and after snakebite
      tracker_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2,
    },
  };

  expParams = getDerivedExpressionParams(expParams);

  return expParams;
};

const getDerivedExpressionParams = (expParams) => {
  expParams.tracker_extension = parseInt(
    expParams.tunable.tracker_diameter * expParams.tunable.punch_ext_ratio,
    10,
  );

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

  return isSnakebiteOn
    ? expParams.tunable.accent_f
    : expParams.tunable.default_mf;
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
    let tempo = DEFAULT_TEMPO;
    let ticksPerSecond = 0;
    let ticksAtLastTempo = 0;
    let timeAtLastTempo = 0;

    const intervals = Array.from(tempoMap.inOrder());

    Object.values(intervals).every((interval) => {
      tempo = interval.data;
      ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;

      if (wanted === "time" && interval.high > input) {
        ticksAtLastTempo = input - lastTick;
        timeAtLastTempo = (ticksAtLastTempo / ticksPerSecond) * 1000;
        lastTime += timeAtLastTempo;
        return false;
      }
      ticksAtLastTempo = parseFloat(interval.high - interval.low);
      timeAtLastTempo = (ticksAtLastTempo / ticksPerSecond) * 1000;
      if (wanted === "tick" && lastTime + timeAtLastTempo > input) {
        timeAtLastTempo = input - lastTime;
        ticksAtLastTempo = parseInt(
          (timeAtLastTempo * ticksPerSecond) / 1000,
          10,
        );
        lastTick += ticksAtLastTempo;
        return false;
      }
      lastTime += timeAtLastTempo;
      lastTick = interval.high;
      return true;
    });

    if (wanted === "time") {
      return lastTime;
    }
    if (wanted === "tick") {
      return lastTick;
    }
    return null;
  };

  const [, ...musicTracks] = midiSamplePlayer.events;

  // const expParams = getExpressionParams();
  // expressionParameters.set(expParams);

  let expParams = get(expressionParameters);

  // XXX Need to reset this somehow when the roll type changes
  if (Object.keys(expParams).length === 0) {
    expressionParameters.set(getExpressionParams());
    expParams = get(expressionParameters);
  }

  const _expressionMap = {};

  const applyTrackerExtension = (ctrlTrackMsgs) =>
    ctrlTrackMsgs
      .map((item) => {
        // We know these are all control holes
        const ctrlFunc = rollProfile[rollType].ctrlMap[item.noteNumber];

        // The only control holes to which the tracker extension can be
        // meaningfully applied are the snakebite accents.
        // NOTE that the extension is applied to the note holes during playback
        // in the MidiEventHandler, but a modified version of this function
        // could be used to apply the extension prior to playback.
        // Note also that no extension is applied to pedal events, but this
        // could be done as well.
        if (
          ctrlFunc == null ||
          item.name !== "Note on" ||
          item.velocity !== 0 ||
          !["acc"].includes(ctrlFunc)
        )
          return item;

        // Note that the delta values for all subsequent events would need to
        // change, if we wanted to generate valid MIDI (in JSON form)
        item.tick += expParams.tracker_extension;

        return item;
      })
      // Adding the tracker extension ticks to the ends of the fast cresc/
      // decresc holes will result in unordered events; resort them.
      .sort((a, b) => (a.tick > b.tick ? 1 : -1));

  const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs) => {
    const _panExpMap = new IntervalTree();

    const expressionCurve = [];

    const expState = getExpressionStateBox(rollType);
    expState.velocity = expParams.tunable.default_mf;

    const extendedCtrlTrackMsgs = applyTrackerExtension(ctrlTrackMsgs);

    // First build the velocity expression map from the control track only
    extendedCtrlTrackMsgs
      .filter(({ name }) => name === "Note on")
      .forEach(({ noteNumber: midiNumber, velocity, tick }) => {
        const msgTime = convertTicksAndTime(tick);

        // We know these are all control holes
        const ctrlFunc = rollProfile[rollType].ctrlMap[midiNumber];
        if (ctrlFunc == null) return; // Usually these are damage holes

        const panVelocity = getVelocityAtTime(msgTime, expState, expParams);
        if (ctrlFunc === "acc") {
          // Snakebite accents tend to be doubled -- do anything about this?
          if (velocity > 0) {
            expState.snakebite_start = Math.max(
              0,
              msgTime - expParams.tunable.snakebite_extension,
            );

            // Add an entry to the expression Interval Tree for the previous
            // interval (when the velocity was lower)
            if (
              expState.snakebite_stop !== null &&
              expState.snakebite_start > expState.snakebite_stop
            ) {
              _panExpMap.insert(
                expState.snakebite_stop,
                expState.snakebite_start,
                panVelocity,
              );
            }

            expState.snakebite_stop = null;
          } else {
            expState.snakebite_stop =
              msgTime + expParams.tunable.snakebite_extension;

            if (expState.snakebite_start < expState.snakebite_stop) {
              _panExpMap.insert(
                expState.snakebite_start,
                expState.snakebite_stop,
                panVelocity,
              );
            }
          }
          expState.time = msgTime;
          expState.velocity = panVelocity;
        }
      });

    // Then update the _expressionMap with velocities for the note events
    noteTrackMsgs
      .filter(({ name, velocity }) => name === "Note on" && !!velocity)
      .forEach(({ noteNumber: midiNumber, tick }) => {
        const msgTime = convertTicksAndTime(tick);

        let noteVelocity = _panExpMap.search(msgTime, msgTime)[0];
        if (noteVelocity == null) {
          noteVelocity = expParams.tunable.default_mf;
        }

        if (tick in _expressionMap) {
          _expressionMap[tick][midiNumber] = noteVelocity;
        } else {
          _expressionMap[tick] = {};
          _expressionMap[tick][midiNumber] = noteVelocity;
        }
      });

    // Build the expression curve, which uses ticks
    let expVelocity = null;
    const intervals = Array.from(_panExpMap.inOrder());
    Object.values(intervals).forEach((interval) => {
      const expStartTick = convertTicksAndTime(interval.low, "tick");
      const expEndTick = convertTicksAndTime(interval.high, "tick");
      const thisVelocity = interval.data;

      // Add a segment of the curve at the default velocity from the start of
      // the piece to the first velocity control event.
      // XXX Also should do this from the final velocity control event to the
      // end of the piece (final tick)
      if (expVelocity === null) {
        expressionCurve.push([0, expParams.tunable.default_mf, 0]);
        expressionCurve.push([
          expStartTick,
          expParams.tunable.default_mf,
          interval.low,
        ]);
        expVelocity = expParams.tunable.default_mf;
      }
      if (thisVelocity !== expVelocity) {
        expressionCurve.push([expStartTick, thisVelocity, interval.low]);
      }
      expressionCurve.push([expEndTick, thisVelocity, interval.high]);
      expVelocity = thisVelocity;
    });

    return expressionCurve;
  };

  // bass notes and control holes
  bassExpCurve.set(buildPanExpMap(musicTracks[0], musicTracks[2], 0, "bass"));

  // treble notes and control holes
  trebleExpCurve.set(
    buildPanExpMap(musicTracks[1], musicTracks[3], 0, "treble"),
  );

  noteVelocitiesMap.set(_expressionMap);

  return _expressionMap;
};

// Note MIDI files usually don't include simulated acceleration via tempo
// events, but theoretically they can. Use those events, or just compute
// everything manually here? Going with the latter for now.
const buildTempoMap = () => {
  const _tempoMap = new IntervalTree();
  const midiTPQ = get(rollMetadata).TICKS_PER_QUARTER;

  const expParams = getExpressionParams();

  const lengthPPI = 300; // Could get scan PPI from MIDI/metadata
  const ticksPerFt = lengthPPI * 12.0;
  let tempo = DEFAULT_TEMPO; // This probably should be an exp param, too
  const minuteDiv = 0.1; // how often the tempo is updated, could be param
  const startSpeed = (midiTPQ * tempo) / ticksPerFt;
  let speed = startSpeed;
  let minute = 0.0;
  let tick = 0;
  let nextTempo = DEFAULT_TEMPO;
  let nextTick = 0;

  // The acceleration emulation *could* begin at the very start of the roll
  // (well above the first hole), but let's just assume that the roll reaches
  // the default tempo right at the first hole.
  while (tick < get(rollMetadata).IMAGE_LENGTH - get(rollMetadata).FIRST_HOLE) {
    minute += minuteDiv;
    nextTick = tick + parseInt(speed * minuteDiv * ticksPerFt, 10);
    speed = startSpeed + minute * expParams.tunable.accelFtPerMin2;
    nextTempo = (speed * ticksPerFt) / midiTPQ;
    _tempoMap.insert(tick, nextTick, tempo);
    tick = nextTick;
    tempo = nextTempo;
  }
  // This ensures that there are no tempo map "misses" at the ery end
  _tempoMap.insert(tick, Infinity, tempo);

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

  const SUSTAIN_PEDAL_ON = parseInt(getKeyByValue(ctrlMap, "sust"), 10);
  const _pedalingMap = new IntervalTree();

  // For 65-note rolls, or any weird MIDI input file with only 1 note track
  if (musicTracks.length === 1) return _pedalingMap;

  const registerPedalEvents = (track, pedalOn, eventNumber) => {
    let tickOn = false;
    track
      // Pedal is on as long as the punch is present
      .filter(({ name }) => name === "Note on")
      .forEach(({ noteNumber, tick, velocity }) => {
        if (noteNumber === pedalOn) {
          if (velocity === 0) {
            // Holes can legitimately begin on tick 0
            if (tickOn !== false)
              _pedalingMap.insert(tickOn, tick, eventNumber);
            tickOn = false;
          } else if (velocity === 1) {
            if (!tickOn) tickOn = tick;
          }
        }
      });
  };

  registerPedalEvents(musicTracks[2], SUSTAIN_PEDAL_ON, SUSTAIN_PEDAL_MIDI);

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
  velocitiesMap,
  midiSamplePlayer,
  tempoMap,
) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];
  const expParams = getExpressionParams();
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
            get(playExpressionsOnOff) && velocitiesMap !== null
              ? velocitiesMap[tick]?.[midiNumber] || velocity
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
  getExpressionParams,
};

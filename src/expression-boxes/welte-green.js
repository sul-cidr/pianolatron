import IntervalTree from "node-interval-tree";
import { get } from "svelte/store";
import { rollMetadata } from "../stores";
import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
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
import { clamp, getHoleType } from "../lib/utils";

const DEFAULT_TEMPO = 60;
const DEFAULT_NOTE_VELOCITY = 64;

// Pedal event codes are identical for all expression boxes (because they are
// read by the MIDI sample player), so definitely should be superclassed.
const SOFT_PEDAL_MIDI = 67;
const SUSTAIN_PEDAL_MIDI = 64;

const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

const getTempoAtTick = (tick, tempoMap) =>
  !tempoMap || !get(useMidiTempoEventsOnOff)
    ? DEFAULT_TEMPO
    : tempoMap.search(tick, tick)[0];

const computeDerivedExpressionParams = (expParams) => {
  // These are the derived parameters, used to compute velocities, but should
  // not be adjusted via the expression controls
  expParams.slow_step =
    (expParams.tunable.welte_mf - expParams.tunable.welte_p) /
    expParams.tunable.slow_decay_rate;
  expParams.fastC_step =
    (expParams.tunable.welte_mf - expParams.tunable.welte_p) /
    expParams.tunable.fastC_decay_rate;
  expParams.fastD_step =
    -(expParams.tunable.welte_f - expParams.tunable.welte_p) /
    expParams.tunable.fastD_decay_rate;
  expParams.tracker_extension = parseInt(
    expParams.tunable.tracker_diameter * expParams.tunable.punch_ext_ratio,
    10,
  );
  return expParams;
};

const getExpressionParams = () => {
  let expParams = null;
  expParams = {
    tunable: {
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,
      welte_loud: 75.0,
      left_adjust: -5.0, // This is a kluge for the Disklavier, could be 0.0
      slow_decay_rate: 2455, // Probably this is 1 velocity step in 2.455s
      fastC_decay_rate: 245,
      fastD_decay_rate: 269,
      tracker_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2, // XXX Double check
    },
  };
  expParams = computeDerivedExpressionParams(expParams);

  return expParams;
};

const getExpressionStateBox = (rollType) => {
  let expState = null;
  if (rollType === "welte-green") {
    expState = {
      velocity: 0.0, // Velocity at last cresc/decresc event
      time: 0.0, // Time (in ms) at last cresc/decresc event
      mf_start: null,
      slow_cresc_start: null,
      slow_decresc_start: null,
      fast_cresc_start: null,
      fast_cresc_stop: null,
      fast_decresc_start: null,
      fast_decresc_stop: null,
    };
  }
  return expState;
};

const getVelocityAtTime = (time, expState, expParams) => {
  // To begin, the new velocity is set to the previous level
  let newVelocity = expState.velocity;
  const msFromLastDynamic = time - expState.time;

  // Active cresc/descresc controls: slow cresc, fast cresc/decresc
  // Slow descresc is on by default if none of slow cresc, fast cresc/decresc
  // is enabled
  // MF hook on prevents velocity from crossing welte_mf from soft or loud side

  // Determine fast crescendo and decrescendo states at this time, handling
  // cases in which the fast change is still happening (the hole hasn't ended
  // yet).
  const isFastCrescOn =
    expState.fast_cresc_start !== null && expState.fast_cresc_stop === null;
  const isFastDecrescOn =
    expState.fast_decresc_start !== null && expState.fast_decresc_stop === null;

  // Default state (no active controls: only slow descresc)
  if (
    expState.slow_cresc_start === null &&
    !isFastCrescOn &&
    !isFastDecrescOn
  ) {
    newVelocity -= msFromLastDynamic * expParams.slow_step;
  } else {
    // Otherwise new target velocity will be a combination of the
    // active control effects
    newVelocity +=
      expState.slow_cresc_start !== null
        ? msFromLastDynamic * expParams.slow_step
        : 0;
    newVelocity += isFastCrescOn ? msFromLastDynamic * expParams.fastC_step : 0;
    newVelocity += isFastDecrescOn
      ? msFromLastDynamic * expParams.fastD_step
      : 0;
  }

  // Handle the mezzo-forte hook
  const velocityDelta = newVelocity - expState.velocity;
  if (expState.mf_start !== null) {
    // If the previous velocity was above MF, keep it there
    if (expState.velocity > expParams.tunable.welte_mf) {
      newVelocity =
        velocityDelta < 0
          ? Math.max(expParams.tunable.welte_mf + 0.001, newVelocity)
          : Math.min(expParams.tunable.welte_f, newVelocity);
      // If the previous velcoity was below MF, keep it there
    } else if (expState.velocity < expParams.tunable.welte_mf) {
      newVelocity =
        velocityDelta > 0
          ? Math.min(expParams.tunable.welte_mf - 0.001, newVelocity)
          : Math.max(expParams.tunable.welte_p, newVelocity);
    }
  } else if (
    expState.slow_cresc_start !== null &&
    !isFastCrescOn &&
    expState.velocity < expParams.tunable.welte_loud
  ) {
    // If no MF hook and only slow crescendo is on, velocity should never
    // exceed welte_loud (which is lower than welte_f)
    newVelocity = Math.min(newVelocity, expParams.tunable.welte_loud - 0.001);
  }

  // Make sure the velocity always stays between welte_p and welte_f
  newVelocity = clamp(
    newVelocity,
    expParams.tunable.welte_p,
    expParams.tunable.welte_f,
  );

  return newVelocity;
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

  if (Object.keys(expParams).length === 0) {
    expressionParameters.set(getExpressionParams());
    expParams = get(expressionParameters);
  }

  const _expressionMap = {};

  // XXX THIS CAN ONLY BE DONE ONCE PER ROLL!
  const applyTrackerExtension = (ctrlTrackMsgs) =>
    ctrlTrackMsgs
      .map((item) => {
        // We know these are all control holes
        const ctrlFunc = rollProfile[rollType].ctrlMap[item.noteNumber];

        // We're only interested in the ends of control holes.
        // No extension is applied to pedal events, but this could be done
        // as well.
        if (
          ctrlFunc == null ||
          item.name !== "Note on" ||
          item.velocity !== 0 ||
          !["sfp", "mf", "cresc", "sff"].includes(ctrlFunc)
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

  const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
    const _panExpMap = new IntervalTree();

    const expressionCurve = [];

    const expState = getExpressionStateBox(rollType);

    expState.velocity = expParams.tunable.welte_p;

    // The tracker extension should be applied to a true copy of the control
    // track messages; otherwise multiple tweaks to the expression settings
    // will result in the end modified off ticks of the control holes being
    // extended further and further...
    const extendedCtrlTrackMsgs = applyTrackerExtension(
      JSON.parse(JSON.stringify(ctrlTrackMsgs)),
    );

    const finalTick = Math.max(
      noteTrackMsgs[noteTrackMsgs.length - 1].tick,
      ctrlTrackMsgs[ctrlTrackMsgs.length - 1].tick,
    );

    // First build the velocity expression map from the control track only
    extendedCtrlTrackMsgs
      .filter(({ name }) => name === "Note on")
      .forEach(({ noteNumber: midiNumber, velocity, tick }) => {
        // We know these are all control holes
        const ctrlFunc = rollProfile[rollType].ctrlMap[midiNumber];

        // Ignore control holes that don't affect playback (most roll types
        // will have some of these), or are likely to be damage holes
        if (
          ctrlFunc == null ||
          !["sfp", "mf", "cresc", "sff"].includes(ctrlFunc)
        )
          return; // Usually these are damage holes

        // The length of the perforation matters for all control holes
        const msgTime = convertTicksAndTime(tick);

        const panVelocity = getVelocityAtTime(msgTime, expState, expParams);

        // These are all quite regular -- how to de-boilerplate this?
        if (ctrlFunc === "mf") {
          if (velocity > 0) {
            expState.mf_start = msgTime;
            expState.mf_stop = null;
          } else {
            expState.mf_stop = msgTime;
          }
        } else if (ctrlFunc === "sfp") {
          if (velocity > 0) {
            expState.fast_decresc_start = msgTime;
            expState.fast_decresc_stop = null;
          } else {
            expState.fast_decresc_stop = msgTime;
          }
        } else if (ctrlFunc === "cresc") {
          if (velocity > 0) {
            expState.slow_cresc_start = msgTime;
            expState.slow_decresc_start = null;
          } else {
            expState.slow_cresc_start = null;
            expState.slow_decresc_start = msgTime;
          }
        } else if (ctrlFunc === "sff") {
          if (velocity > 0) {
            expState.fast_cresc_start = msgTime;
            expState.fast_cresc_stop = null;
          } else {
            expState.fast_cresc_stop = msgTime;
          }
        }

        _panExpMap.insert(expState.time, msgTime, [
          expState.velocity,
          panVelocity,
          expState.time,
          msgTime,
        ]);

        expState.time = msgTime;
        expState.velocity = panVelocity;
      });

    // Extend the expression map so that it extends from the last control hole
    // to the final note on this half of the roll (if needed)
    const finalTime = convertTicksAndTime(finalTick);

    if (finalTime > expState.time) {
      const finalPanVelocity = getVelocityAtTime(
        finalTime,
        expState,
        expParams,
      );
      _panExpMap.insert(expState.time, finalTime, [
        expState.velocity,
        finalPanVelocity,
        expState.time,
        finalTime,
      ]);
    }

    // Then update the _expressionMap with velocities for the note events
    noteTrackMsgs
      .filter(({ name, velocity }) => name === "Note on" && !!velocity)
      .forEach(({ noteNumber: midiNumber, tick }) => {
        const msgTime = convertTicksAndTime(tick);

        const [startVelocity, endVelocity, startTime, endTime] =
          _panExpMap.search(msgTime, msgTime)[0];

        const notePositionInInterval =
          (msgTime - startTime) / (endTime - startTime);

        const noteVelocity =
          startVelocity +
          (endVelocity - startVelocity) * notePositionInInterval;

        if (tick in _expressionMap) {
          _expressionMap[tick][midiNumber] = noteVelocity + adjust;
        } else {
          _expressionMap[tick] = {};
          _expressionMap[tick][midiNumber] = noteVelocity + adjust;
        }
      });

    // Build the expression curve, which uses ticks (not ms)
    const intervals = Array.from(_panExpMap.inOrder());
    Object.values(intervals).forEach((interval) => {
      const expStartTick = convertTicksAndTime(interval.low, "tick");
      const expEndTick = convertTicksAndTime(interval.high, "tick");
      const [startVelocity, endVelocity, startTime, endTime] = interval.data;

      expressionCurve.push([expStartTick, startVelocity, startTime]);
      expressionCurve.push([expEndTick, endVelocity, endTime]);
    });

    return expressionCurve;
  };

  // bass notes and control holes
  bassExpCurve.set(
    buildPanExpMap(
      musicTracks[0],
      musicTracks[2],
      expParams.tunable.left_adjust,
    ),
  );

  // treble notes and control holes
  trebleExpCurve.set(buildPanExpMap(musicTracks[1], musicTracks[3], 0));

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
 */

// Get pedal events from track 2 (bass control = soft pedal) and
// track 3 (treble control = sustain pedal)
const buildPedalingMap = (musicTracks) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];

  const SUSTAIN_PEDAL_ON = parseInt(getKeyByValue(ctrlMap, "sust"), 10);
  const SOFT_PEDAL_ON = parseInt(getKeyByValue(ctrlMap, "sust"), 10);

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
  registerPedalEvents(musicTracks[3], SOFT_PEDAL_ON, SOFT_PEDAL_MIDI);

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
        } else if (ctrlMap[midiNumber] === "soft") {
          softOnOff.set(!!velocity);
        }
      }
    } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      // This only happens if the note MIDI has tempo events to emulate
      // acceleration. Usually this is not done, but the MIDI will however
      // have one event at the beginning, setting the default tempo (60).
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
  computeDerivedExpressionParams,
};

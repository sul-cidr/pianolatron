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
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { clamp, getHoleType } from "../lib/utils";

const DEFAULT_TEMPO = 60;

const getKeyByValue = (object, value) => {
  Object.keys(object).find((key) => object[key] === value);
};

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
  if (rollType === "welte-red") {
    expParams = {
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,
      welte_loud: 75.0,
      left_adjust: -5.0, // This is a kluge for the Disklavier, could be 0.0
      cresc_rate: 1.0,
      slow_decay_rate: 2380, // Probably this is 1 velocity step in 2.38s
      fastC_decay_rate: 300,
      fastD_decay_rate: 400,
      trackerbar_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_extension_fraction: 0.75,
      accelFtPerMin2: 0.3147,
    };
    expParams.slow_step =
      (expParams.welte_mf - expParams.welte_p) / expParams.slow_decay_rate;
    expParams.fastC_step =
      (expParams.welte_mf - expParams.welte_p) / expParams.fastC_decay_rate;
    expParams.fastD_step =
      -(expParams.welte_f - expParams.welte_p) / expParams.fastD_decay_rate;
    expParams.tracker_extension = parseInt(
      expParams.trackerbar_diameter * expParams.punch_extension_fraction,
      10,
    );
  }
  return expParams;
};

const getExpressionStateBox = (rollType) => {
  let expState = null;
  if (rollType === "welte-red") {
    expState = {
      velocity: 0.0, // Velocity at last cresc/decresc event
      time: 0.0, // Time (in ms) at last cresc/decresc event
      mf_start: null,
      slow_cresc_start: null,
      slow_decresc_start: null,
      fast_cresc_start: null,
      fast_cresc_stop: null, // Can be in the future due to tracker extension
      fast_decresc_start: null,
      fast_decresc_stop: null,
      tempo: null,
      tick: 0,
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
  // yet) or we know when the fast change ends, but the current time is before
  // that (this can occur due to the tracker width emulation extending the
  // effective duration of the hole beyond its physical length).
  const isFastCrescOn =
    (expState.fast_cresc_start !== null && expState.fast_cresc_stop === null) ||
    (expState.fast_cresc_start !== null &&
      expState.fast_cresc_stop !== null &&
      expState.fast_cresc_stop > time);
  const isFastDecrescOn =
    (expState.fast_decresc_start !== null &&
      expState.fast_decresc_stop === null) ||
    (expState.fast_decresc_start !== null &&
      expState.fast_decresc_stop !== null &&
      expState.fast_decresc_stop > time);

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

  // Handle the MF hook
  const velocityDelta = newVelocity - expState.velocity;
  if (expState.mf_start !== null) {
    // If the previous velocity was above MF, keep it there
    if (expState.velocity > expParams.welte_mf) {
      newVelocity =
        velocityDelta < 0
          ? Math.max(expParams.welte_mf + 0.001, newVelocity)
          : Math.min(expParams.welte_f, newVelocity);
      // If the previous velcoity was below MF, keep it there
    } else if (expState.velocity < expParams.welte_mf) {
      newVelocity =
        velocityDelta > 0
          ? Math.min(expParams.welte_mf - 0.001, newVelocity)
          : Math.max(expParams.welte_p, newVelocity);
    }
  } else if (
    expState.slow_cresc_start !== null &&
    !isFastCrescOn &&
    expState.velocity < expParams.welte_loud
  ) {
    // If no MF hook and only slow crescendo is on, velocity should never
    // exceed welte_loud (which is lower than welte_f)
    newVelocity = Math.min(newVelocity, expParams.welte_loud - 0.001);
  }

  // Make sure the velocity always stays between welte_p and welte_f
  newVelocity = clamp(newVelocity, expParams.welte_p, expParams.welte_f);

  return newVelocity;
};

const buildNoteVelocitiesMap = (midiSamplePlayer, tempoMap) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const midiTPQ = midiSamplePlayer.getDivision().division;

  const getMillisecondsAtTick = (tick) => {
    if (!tempoMap || !get(useMidiTempoEventsOnOff))
      return (parseFloat(tick) / midiTPQ) * 1000;
    let lastTime = 0.0;
    let lastTick = 0;
    let lastTempo = DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
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
    const ticksAtLastTempo = parseFloat(tick - lastTick);
    const timeAtLastTempo = (ticksAtLastTempo / lastTicksPerSecond) * 1000;
    lastTime += timeAtLastTempo;
    return lastTime;
  };

  const [, ...musicTracks] = midiSamplePlayer.events;

  const expParams = getExpressionParams(rollType);

  expressionParameters.set(expParams);

  const _expressionMap = {};

  const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
    const expState = getExpressionStateBox(rollType);

    const expressionCurve = [];

    expState.velocity = expParams.welte_p;

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
      const msgTime = getMillisecondsAtTick(tick);

      const holeType = getHoleType({ m: midiNumber }, rollType);

      // This is only applied if we're at the end of a fast cresc or decresc
      let applyTrackerExtension = false;

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
        if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc)) {
          return;
        }
        const panVelocity = getVelocityAtTime(msgTime, expState, expParams);
        const trackerExtensionSeconds =
          expParams.tracker_extension / ticksPerSecond;
        if (ctrlFunc === "mf_on" && velocity > 0) {
          expState.mf_start = msgTime;
        } else if (ctrlFunc === "mf_off" && velocity > 0) {
          expState.mf_start = null;
        } else if (ctrlFunc === "cresc_on" && velocity > 0) {
          expState.slow_cresc_start = msgTime;
          expState.slow_decresc_start = null;
        } else if (ctrlFunc === "cresc_off" && velocity > 0) {
          expState.slow_cresc_start = null;
          expState.slow_decresc_start = msgTime;
        } else if (ctrlFunc === "sf_on") {
          if (velocity > 0) {
            expState.fast_cresc_start = msgTime;
            expState.fast_cresc_stop = null;
          } else {
            applyTrackerExtension = true;
            expState.fast_cresc_stop =
              msgTime + trackerExtensionSeconds * 1000.0;
          }
        } else if (ctrlFunc === "sf_off") {
          if (velocity > 0) {
            expState.fast_decresc_start = msgTime;
            expState.fast_decresc_stop = null;
          } else {
            applyTrackerExtension = true;
            expState.fast_decresc_stop =
              msgTime + trackerExtensionSeconds * 1000.0;
          }
        }

        let expressionTick = tick;

        if (applyTrackerExtension === true)
          expressionTick += expParams.tracker_extension;

        expState.tick = expressionTick;
        expState.time = msgTime;
        expState.velocity = panVelocity;
        expressionCurve.push([expressionTick, panVelocity, msgTime]);
      }
    });
    return expressionCurve;
  };

  // bass notes and control holes
  bassExpCurve.set(
    buildPanExpMap(musicTracks[0], musicTracks[2], expParams.left_adjust),
  );

  // treble notes and control holes
  trebleExpCurve.set(buildPanExpMap(musicTracks[1], musicTracks[3], 0));

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

  const SOFT_PEDAL_ON = getKeyByValue(ctrlMap, "soft_on");
  const SOFT_PEDAL_OFF = getKeyByValue(ctrlMap, "soft_off");
  const SUSTAIN_PEDAL_ON = getKeyByValue(ctrlMap, "sust_on");
  const SUSTAIN_PEDAL_OFF = getKeyByValue(ctrlMap, "sust_off");
  const _pedalingMap = new IntervalTree();

  // For 65-note rolls, or any weird MIDI input file with only 1 note track
  if (musicTracks.length === 1) return _pedalingMap;

  const registerPedalEvents = (track, pedalOn, pedalOff) => {
    let tickOn = false;
    track
      // Only want beginning of note holes for lock & cancel type expression
      // mechanisms (works for Welte red and Licensee, not 88 or Welte green)
      .filter(({ name, velocity }) => name === "Note on" && velocity === 1)
      .forEach(({ noteNumber, tick }) => {
        if (noteNumber === pedalOff) {
          if (tickOn) _pedalingMap.insert(tickOn, tick, pedalOn);
          tickOn = false;
        } else if (noteNumber === pedalOn) {
          if (!tickOn) tickOn = tick;
        }
      });
  };

  registerPedalEvents(musicTracks[2], SOFT_PEDAL_ON, SOFT_PEDAL_OFF);
  registerPedalEvents(musicTracks[3], SUSTAIN_PEDAL_ON, SUSTAIN_PEDAL_OFF);

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
    // XXX Maybe include a setting to toggle using "artificial" accel events?
    midiSamplePlayer.setTempo(tempo * get(tempoCoefficient));
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
        if (velocity === 0) {
          // Length of pedal control holes doesn't matter for red Welte
          // (but it does for green Welte...)
          return;
        }
        if (ctrlMap[midiNumber] === "sust_on") {
          sustainOnOff.set(true);
        } else if (ctrlMap[midiNumber] === "sust_off") {
          sustainOnOff.set(false);
        } else if (ctrlMap[midiNumber] === "soft_on") {
          softOnOff.set(true);
        } else if (ctrlMap[midiNumber] === "soft_off") {
          softOnOff.set(false);
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

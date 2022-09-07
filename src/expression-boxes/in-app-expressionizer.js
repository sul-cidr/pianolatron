// TODO:
/* eslint-disable camelcase */

import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import {
  activeNotes,
  bassExpCurve,
  expressionParameters,
  playExpressionsOnOff,
  rollMetadata,
  rollPedalingOnOff,
  tempoCoefficient,
  trebleExpCurve,
  useMidiTempoEventsOnOff,
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { clamp, getHoleType } from "../lib/utils";

export default class InAppExpressionizer {
  #rollType = get(rollMetadata).ROLL_TYPE;
  #midiTPQ = get(rollMetadata).TICKS_PER_QUARTER;

  defaultTempo = 60;
  defaultNoteVelocity = 64;

  midiSoftPedal = 67;
  midiSustPedal = 64;

  ctrlMap = rollProfile[this.#rollType].ctrlMap;

  metadataTrack;
  bassNotesTrack;
  trebleNotesTrack;
  bassControlsTrack;
  trebleControlsTrack;

  // ?NOTE: should be good for (at least) welte-red and welte-green
  computeDerivedExpressionParams = () => {
    // These are the derived parameters, used to compute velocities, but should
    // not be adjusted via the expression controls
    const tunable =
      get(expressionParameters)?.tunable ||
      this.defaultExpressionParams.tunable;

    const {
      welte_f,
      welte_mf,
      welte_p,
      slow_decay_rate,
      fastC_decay_rate,
      fastD_decay_rate,
      tracker_diameter,
      punch_ext_ratio,
    } = tunable;

    return {
      tunable,
      slow_step: (welte_mf - welte_p) / slow_decay_rate,
      fastC_step: (welte_mf - welte_p) / fastC_decay_rate,
      fastD_step: -(welte_f - welte_p) / fastD_decay_rate,
      tracker_extension: parseInt(tracker_diameter * punch_ext_ratio, 10),
    };
  };

  // ?Needs looking at...
  convertTicksAndTime = (input, target) => {
    let wanted = target;
    if (wanted == null) wanted = "time";

    if (!get(useMidiTempoEventsOnOff)) {
      if (wanted === "time") {
        return (parseFloat(input) / this.#midiTPQ) * 1000;
      }
      if (wanted === "tick") {
        return parseInt((input * this.#midiTPQ) / 1000, 10);
      }
    }

    let lastTime = 0.0;
    let lastTick = 0;
    let tempo = this.defaultTemp;
    let ticksPerSecond = 0;
    let ticksAtLastTempo = 0;
    let timeAtLastTempo = 0;

    const intervals = Array.from(this.tempoMap.inOrder());

    Object.values(intervals).every((interval) => {
      tempo = interval.data;
      ticksPerSecond = (parseFloat(tempo) * this.#midiTPQ) / 60.0;

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

  getTempoAtTick = (tick) =>
    !get(useMidiTempoEventsOnOff)
      ? this.defaultTempo
      : this.tempoMap.search(tick, tick)[0];

  getVelocityAtTime = (time, expState) => {
    const { slow_step, fastC_step, fastD_step, tunable } = this.expParams;
    const { welte_f, welte_loud, welte_mf, welte_p } = tunable;

    // To begin, the new velocity is set to the previous level
    let newVelocity = expState.velocity;
    const msFromLastDynamic = time - expState.time;

    // Active cresc/decresc controls: slow cresc, fast cresc/decresc
    // Slow decresc is on by default if none of slow cresc, fast cresc/decresc
    // is enabled
    // MF hook on prevents velocity from crossing welte_mf from soft or loud side

    // Determine fast crescendo and decrescendo states at this time, handling
    // cases in which the fast change is still happening (the hole hasn't ended
    // yet).
    const isFastCrescOn =
      expState.fast_cresc_start !== null && expState.fast_cresc_stop === null;
    const isFastDecrescOn =
      expState.fast_decresc_start !== null &&
      expState.fast_decresc_stop === null;

    // Default state (no active controls: only slow decresc)
    if (
      expState.slow_cresc_start === null &&
      !isFastCrescOn &&
      !isFastDecrescOn
    ) {
      newVelocity -= msFromLastDynamic * slow_step;
    } else {
      // Otherwise new target velocity will be a combination of the
      // active control effects
      newVelocity +=
        expState.slow_cresc_start !== null ? msFromLastDynamic * slow_step : 0;
      newVelocity += isFastCrescOn ? msFromLastDynamic * fastC_step : 0;
      newVelocity += isFastDecrescOn ? msFromLastDynamic * fastD_step : 0;
    }

    // Handle the mezzo-forte hook
    const velocityDelta = newVelocity - expState.velocity;
    if (expState.mf_start !== null) {
      // If the previous velocity was above MF, keep it there
      if (expState.velocity > welte_mf) {
        newVelocity =
          velocityDelta < 0
            ? Math.max(welte_mf + 0.001, newVelocity)
            : Math.min(welte_f, newVelocity);
        // If the previous velocity was below MF, keep it there
      } else if (expState.velocity < welte_mf) {
        newVelocity =
          velocityDelta > 0
            ? Math.min(welte_mf - 0.001, newVelocity)
            : Math.max(welte_p, newVelocity);
      }
    } else if (
      expState.slow_cresc_start !== null &&
      !isFastCrescOn &&
      expState.velocity < welte_loud
    ) {
      // If no MF hook and only slow crescendo is on, velocity should never
      // exceed welte_loud (which is lower than welte_f)
      newVelocity = Math.min(newVelocity, welte_loud - 0.001);
    }

    // Make sure the velocity always stays between welte_p and welte_f
    newVelocity = clamp(newVelocity, welte_p, welte_f);

    return newVelocity;
  };

  //
  // =========================================================================
  // ==  Constructor  ==
  // =========================================================================
  constructor(midiSamplePlayer, startNote, stopNote) {
    this.midiSamplePlayer = midiSamplePlayer;
    this.startNote = startNote;
    this.stopNote = stopNote;

    [
      this.metadataTrack,
      this.bassNotesTrack,
      this.trebleNotesTrack,
      this.bassControlsTrack,
      this.trebleControlsTrack,
    ] = midiSamplePlayer.events;
  }

  initializeExpressionizer = () => {
    if (!Object.keys(get(expressionParameters)).length)
      expressionParameters.set(this.defaultExpressionParams);
    this.expParams = this.computeDerivedExpressionParams();

    this.tempoMap = this.#buildTempoMap();
    this.noteVelocitiesMap = this.#buildNoteVelocitiesMap();
    this.pedalingMap = this.buildPedalingMap();
    this.notesMap = this.#buildNotesMap();

    expressionParameters.subscribe(() => {
      this.expParams = this.computeDerivedExpressionParams();
      this.#buildNoteVelocitiesMap();
    });
  };

  // ?NOTE: should be good for (at least) welte-red and welte-green
  #buildTempoMap = () => {
    // Note MIDI files usually don't include simulated acceleration via tempo
    // events, but theoretically they can. Use those events, or just compute
    // everything manually here? Going with the latter for now.
    const tempoMap = new IntervalTree();

    const lengthPPI = 300; // Could get scan PPI from MIDI/metadata
    const ticksPerFt = lengthPPI * 12.0;
    const minuteDiv = 0.1; // how often the tempo is updated, could be param
    const startSpeed = (this.#midiTPQ * this.defaultTempo) / ticksPerFt;

    let tempo = this.defaultTempo; // This probably should be an exp param, too
    let speed = startSpeed;
    let minute = 0.0;
    let tick = 0;
    let nextTempo = this.defaultTempo;
    let nextTick = 0;

    // The acceleration emulation *could* begin at the very start of the roll
    // (well above the first hole), but let's just assume that the roll reaches
    // the default tempo right at the first hole.
    while (
      tick <
      get(rollMetadata).IMAGE_LENGTH - get(rollMetadata).FIRST_HOLE
    ) {
      minute += minuteDiv;
      nextTick = tick + parseInt(speed * minuteDiv * ticksPerFt, 10);
      speed = startSpeed + minute * this.expParams.tunable.accelFtPerMin2;
      nextTempo = (speed * ticksPerFt) / this.#midiTPQ;
      tempoMap.insert(tick, nextTick, tempo);
      tick = nextTick;
      tempo = nextTempo;
    }

    // This ensures that there are no tempo map "misses" at the very end
    tempoMap.insert(tick, Infinity, tempo);

    return tempoMap;
  };

  #buildNoteVelocitiesMap = () => {
    const expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const expressionCurve = [];

      // First build the velocity expression map from the control track only
      const [panExpMap, expState] = ctrlTrackMsgs
        .filter(({ name }) => name === "Note on")
        .map(this.extendControlHoles)
        // Adding the tracker extension ticks to the ends of the fast cresc/
        // decresc holes will result in unordered events; resort them.
        .sort((a, b) => a.tick - b.tick)
        .reduce(this.panExpMapReducer, [
          new IntervalTree(),
          {
            velocity: this.expParams.tunable.welte_p, // Velocity at last cresc/decresc event
            time: 0.0, // Time (in ms) at last cresc/decresc event
            mf_start: null,
            slow_cresc_start: null,
            slow_decresc_start: null,
            fast_cresc_start: null,
            fast_cresc_stop: null, // Can be in the future due to tracker extension
            fast_decresc_start: null,
            fast_decresc_stop: null,
          },
        ]);

      // Extend the expression map so that it extends from the last control hole
      // to the final note on this half of the roll (if needed)
      const finalTick = Math.max(
        noteTrackMsgs[noteTrackMsgs.length - 1].tick,
        ctrlTrackMsgs[ctrlTrackMsgs.length - 1].tick,
      );
      const finalTime = this.convertTicksAndTime(finalTick);

      if (finalTime > expState.time) {
        const finalPanVelocity = this.getVelocityAtTime(finalTime, expState);
        panExpMap.insert(expState.time, finalTime, [
          expState.velocity,
          finalPanVelocity,
          expState.time,
          finalTime,
        ]);
      }

      // Then update the expressionMap with velocities for the note events
      noteTrackMsgs
        .filter(({ name, velocity }) => name === "Note on" && !!velocity)
        .forEach(({ noteNumber: midiNumber, tick }) => {
          const msgTime = this.convertTicksAndTime(tick);

          const [startVelocity, endVelocity, startTime, endTime] =
            panExpMap.search(msgTime, msgTime)[0];

          const notePositionInInterval =
            (msgTime - startTime) / (endTime - startTime);

          const noteVelocity =
            startVelocity +
            (endVelocity - startVelocity) * notePositionInInterval;

          if (tick in expressionMap) {
            expressionMap[tick][midiNumber] = noteVelocity + adjust;
          } else {
            expressionMap[tick] = {};
            expressionMap[tick][midiNumber] = noteVelocity + adjust;
          }
        });

      // Build the expression curve, which uses ticks (not ms)
      const intervals = Array.from(panExpMap.inOrder());
      Object.values(intervals).forEach((interval) => {
        const expStartTick = this.convertTicksAndTime(interval.low, "tick");
        const expEndTick = this.convertTicksAndTime(interval.high, "tick");
        const [startVelocity, endVelocity, startTime, endTime] = interval.data;

        expressionCurve.push([expStartTick, startVelocity, startTime]);
        expressionCurve.push([expEndTick, endVelocity, endTime]);
      });

      return expressionCurve;
    };

    // bass notes and control holes
    bassExpCurve.set(
      buildPanExpMap(
        this.bassNotesTrack,
        this.bassControlsTrack,
        this.expParams.tunable.left_adjust,
      ),
    );

    // treble notes and control holes
    trebleExpCurve.set(
      buildPanExpMap(this.trebleNotesTrack, this.trebleControlsTrack, 0),
    );

    return expressionMap;
  };

  #buildNotesMap = () => {
    const _notesMap = new IntervalTree();
    [this.bassNotesTrack, this.trebleNotesTrack].forEach((track) => {
      const tickOn = {};
      track
        .filter(
          ({ name, noteNumber }) =>
            name === "Note on" &&
            getHoleType({ m: noteNumber }, this.#rollType) === "note",
        )
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

  midiEventHandler = ({
    name: msgType,
    noteNumber: midiNumber,
    velocity,
    data,
    tick,
  }) => {
    // Note MIDI files won't have embedded tempo events. Need to check tempoMap
    // which should include tempo events to emulate roll acceleration.
    const tempo = this.getTempoAtTick(tick);

    const playerTempo = tempo * get(tempoCoefficient);
    if (this.midiSamplePlayer.tempo !== playerTempo) {
      this.midiSamplePlayer.pause();
      this.midiSamplePlayer.setTempo(playerTempo);
      this.midiSamplePlayer.play();
    }

    if (msgType === "Note on") {
      const holeType = getHoleType({ m: midiNumber }, this.#rollType);
      if (holeType === "note") {
        if (velocity === 0) {
          const ticksPerSecond = (parseFloat(tempo) * this.midiTPQ) / 60.0;
          // At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to acceleration
          const trackerExtensionSeconds =
            this.expParams.tracker_extension / ticksPerSecond;
          this.stopNote(midiNumber, `+${trackerExtensionSeconds}`);
          activeNotes.delete(midiNumber);
        } else {
          const noteVelocity = get(playExpressionsOnOff)
            ? this.noteVelocitiesMap[tick]?.[midiNumber] || velocity
            : this.defaultNoteVelocity;
          this.startNote(midiNumber, noteVelocity);
          activeNotes.add(midiNumber);
        }
      } else if (holeType === "pedal" && get(rollPedalingOnOff)) {
        this.handlePedal(velocity, midiNumber);
      }
    } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      // This only happens if the note MIDI has tempo events to emulate
      // acceleration. Usually this is not done, but the MIDI will however
      // have one event at the beginning, setting the default tempo (60).
      const newTempo = data * get(tempoCoefficient);
      this.midiSamplePlayer.setTempo(newTempo);
    }
  };
}

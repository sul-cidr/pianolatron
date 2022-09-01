// TODO:
/* eslint-disable camelcase */

import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
  rollMetadata,
  bassExpCurve,
  trebleExpCurve,
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { clamp, getHoleType } from "../lib/utils";

const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

export default class InAppExpressionizer {
  defaultTempo = 60;

  // ?NOTE: different for each roll type
  defaultExpressionParams = {
    tunable: {
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,
      welte_loud: 75.0,
      left_adjust: -5.0, // This is a kludge for the Disklavier, could be 0.0
      slow_decay_rate: 2380, // Probably this is 1 velocity step in 2.38s
      fastC_decay_rate: 300,
      fastD_decay_rate: 400,
      tracker_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.3147,
    },
  };

  #rollType = get(rollMetadata).ROLL_TYPE;
  #midiTPQ = get(rollMetadata).TICKS_PER_QUARTER;
  #ctrlMap = rollProfile[this.#rollType].ctrlMap;

  midiSoftOn = 67;
  midiSustOn = 64;
  SOFT_PEDAL_ON = getKeyByValue(this.#ctrlMap, "soft_on");
  SOFT_PEDAL_OFF = getKeyByValue(this.#ctrlMap, "soft_off");
  SUSTAIN_PEDAL_ON = getKeyByValue(this.#ctrlMap, "sust_on");
  SUSTAIN_PEDAL_OFF = getKeyByValue(this.#ctrlMap, "sust_off");

  #metadataTrack;
  #musicTracks;
  #expParams;

  // ?NOTE: should be good for (at least) welte-red and welte-green
  computeDerivedExpressionParams = () => {
    // These are the derived parameters, used to compute velocities, but should
    // not be adjusted via the expression controls
    const { tunable } = this.defaultExpressionParams;
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

  // ? wants looking at
  // XXX THIS CAN ONLY BE DONE ONCE PER ROLL!
  applyTrackerExtension = (ctrlTrackMsgs) =>
    ctrlTrackMsgs
      .map((item) => {
        // We know these are all control holes
        const ctrlFunc = this.#ctrlMap[item.noteNumber];

        // We're only interested in the ends of control holes, and specifically
        // only the ends of fast cresc or decresc holes (for now)
        // NOTE that the extension is applied to the note holes during playback
        // in the MidiEventHandler, but a modified version of this function
        // could be used to apply the extension prior to playback.
        // Note also that no extension is applied to pedal events, but this
        // could be done as well.
        if (
          ctrlFunc == null ||
          item.name !== "Note on" ||
          item.velocity !== 0 ||
          !["sf_on", "sf_off"].includes(ctrlFunc)
        )
          return item;

        // Note that the delta values for all subsequent events would need to
        // change, if we wanted to generate valid MIDI (in JSON form)
        item.tick += this.#expParams.tracker_extension;

        return item;
      })
      // Adding the tracker extension ticks to the ends of the fast cresc/
      // decresc holes will result in unordered events; resort them.
      .sort((a, b) => (a.tick > b.tick ? 1 : -1));

  getVelocityAtTime = (time, expState) => {
    const { slow_step, fastC_step, fastD_step, tunable } = this.#expParams;
    const { welte_f, welte_loud, welte_mf, welte_p } = tunable;

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
      expState.fast_decresc_start !== null &&
      expState.fast_decresc_stop === null;

    // Default state (no active controls: only slow descresc)
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
        // If the previous velcoity was below MF, keep it there
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

  constructor(midiSamplePlayer) {
    console.log("midiSoftOn:", this.midiSoftOn);
    console.log("midiSustOn:", this.midiSustOn);
    console.log("SOFT_PEDAL_ON:", this.SOFT_PEDAL_ON);
    console.log("SOFT_PEDAL_OFF:", this.SOFT_PEDAL_OFF);
    console.log("SUSTAIN_PEDAL_ON:", this.SUSTAIN_PEDAL_ON);
    console.log("SUSTAIN_PEDAL_OFF:", this.SUSTAIN_PEDAL_OFF);

    console.log(get(rollMetadata));

    this.midiSamplePlayer = midiSamplePlayer;
    [this.#metadataTrack, ...this.#musicTracks] = midiSamplePlayer.events;

    this.#expParams = this.computeDerivedExpressionParams();
    this.tempoMap = this.#buildTempoMap();
    this.noteVelocitiesMap = this.#buildNoteVelocitiesMap();
    this.pedalingMap = this.#buildPedalingMap();
    this.notesMap = this.#buildNotesMap();

    console.log("expParams", this.#expParams);
  }

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
      speed = startSpeed + minute * this.#expParams.tunable.accelFtPerMin2;
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
    // // const expParams = getExpressionParams();
    // // expressionParameters.set(expParams);

    // let expParams = get(expressionParameters);

    // if (Object.keys(expParams).length === 0) {
    //   expressionParameters.set(getExpressionParams());
    //   expParams = get(expressionParameters);
    // }

    const expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const _panExpMap = new IntervalTree();

      const expressionCurve = [];

      // const expState = getExpressionStateBox(rollType);

      const expState = {
        velocity: this.#expParams.tunable.welte_p, // Velocity at last cresc/decresc event
        time: 0.0, // Time (in ms) at last cresc/decresc event
        mf_start: null,
        slow_cresc_start: null,
        slow_decresc_start: null,
        fast_cresc_start: null,
        fast_cresc_stop: null, // Can be in the future due to tracker extension
        fast_decresc_start: null,
        fast_decresc_stop: null,
      };

      // ? to look at
      // The tracker extension should be applied to a true copy of the control
      // track messages; otherwise multiple tweaks to the expression settings
      // will result in the end modified off ticks of the control holes being
      // extended further and further...
      const extendedCtrlTrackMsgs = this.applyTrackerExtension(
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
          const ctrlFunc = this.#ctrlMap[midiNumber];

          // Ignore control holes that don't affect playback (most roll types
          // will have some of these), or are likely to be damage holes
          if (
            ctrlFunc == null ||
            ![
              "sf_on",
              "sf_off",
              "cresc_on",
              "cresc_off",
              "mf_on",
              "mf_off",
            ].includes(ctrlFunc)
          )
            return; // Usually these are damage holes

          // Fast crescendo and decrescendo controls are the only ones for which
          // the length of the perforation matters
          if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc)) {
            return;
          }

          const msgTime = this.convertTicksAndTime(tick);

          const panVelocity = this.getVelocityAtTime(msgTime, expState);

          // ? rewrite as switch?
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
              expState.fast_cresc_stop = msgTime;
            }
          } else if (ctrlFunc === "sf_off") {
            if (velocity > 0) {
              expState.fast_decresc_start = msgTime;
              expState.fast_decresc_stop = null;
            } else {
              expState.fast_decresc_stop = msgTime;
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
      const finalTime = this.convertTicksAndTime(finalTick);

      if (finalTime > expState.time) {
        const finalPanVelocity = this.getVelocityAtTime(finalTime, expState);
        _panExpMap.insert(expState.time, finalTime, [
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
            _panExpMap.search(msgTime, msgTime)[0];

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
      const intervals = Array.from(_panExpMap.inOrder());
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
        this.#musicTracks[0],
        this.#musicTracks[2],
        this.#expParams.tunable.left_adjust,
      ),
    );

    // treble notes and control holes
    trebleExpCurve.set(
      buildPanExpMap(this.#musicTracks[1], this.#musicTracks[3], 0),
    );

    return expressionMap;
  };

  #buildPedalingMap = () => {
    // // where two or more "music tracks" exist, pedal events are expected to have
    // //  been duplicated across tracks, so we read only from the first one.
    // const [eventsTrack] = this.#musicTracks;
    // const _pedalingMap = new IntervalTree();
    // const controllerEvents = eventsTrack.filter(
    //   ({ name }) => name === "Controller Change",
    // );

    // const enterEvents = (eventNumber) => {
    //   let tickOn = false;
    //   controllerEvents
    //     .filter(({ number }) => number === eventNumber)
    //     .forEach(({ value, tick }) => {
    //       if (value === 0) {
    //         if (tickOn) _pedalingMap.insert(tickOn, tick, eventNumber);
    //         tickOn = false;
    //       } else if (value === 127) {
    //         if (!tickOn) tickOn = tick;
    //       }
    //     });
    // };

    // enterEvents(this.midiSoftOn);
    // enterEvents(this.midiSustOn);

    // return _pedalingMap;

    // const SOFT_PEDAL_ON = parseInt(getKeyByValue(this.#ctrlMap, "soft_on"), 10);
    // const SOFT_PEDAL_OFF = parseInt(getKeyByValue(this.#ctrlMap, "soft_off"), 10);
    // const SUSTAIN_PEDAL_ON = parseInt(getKeyByValue(this.#ctrlMap, "sust_on"), 10);
    // const SUSTAIN_PEDAL_OFF = parseInt(getKeyByValue(this.#ctrlMap, "sust_off"), 10);
    const pedalingMap = new IntervalTree();

    // For 65-note rolls, or any weird MIDI input file with only 1 note track
    if (this.#musicTracks.length === 1) return pedalingMap;

    const registerPedalEvents = (track, pedalOn, pedalOff, eventNumber) => {
      let tickOn = false;
      track
        // Only want beginning of note holes for lock & cancel type expression
        // mechanisms (works for Welte red and Licensee, not 88 or Welte green)
        .filter(({ name, velocity }) => name === "Note on" && velocity === 1)
        .forEach(({ noteNumber, tick }) => {
          if (noteNumber === pedalOff) {
            // Holes can legitimately begin on tick 0
            if (tickOn !== false) pedalingMap.insert(tickOn, tick, eventNumber);
            tickOn = false;
          } else if (noteNumber === pedalOn) {
            if (!tickOn) tickOn = tick;
          }
        });
    };

    registerPedalEvents(
      this.#musicTracks[2],
      this.SOFT_PEDAL_ON,
      this.SOFT_PEDAL_OFF,
      this.SOFT_PEDAL_MIDI,
    );
    registerPedalEvents(
      this.#musicTracks[3],
      this.SUSTAIN_PEDAL_ON,
      this.SUSTAIN_PEDAL_OFF,
      this.SUSTAIN_PEDAL_MIDI,
    );

    return pedalingMap;
  };

  #buildNotesMap = () => {
    const _notesMap = new IntervalTree();
    // should be just this.#musicTracks[0] and this.#musicTracks[1] ??
    this.#musicTracks.forEach((track) => {
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

  buildMidiEventHandler =
    (startNote, stopNote) =>
    ({ name, value, number, noteNumber, velocity, data, tick }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          stopNote(noteNumber);
        } else {
          const expressionizedVelocity =
            this.noteVelocitiesMap[tick]?.[noteNumber] || velocity;
          startNote(noteNumber, expressionizedVelocity);
          activeNotes.add(noteNumber);
        }
      } else if (name === "Controller Change" && get(rollPedalingOnOff)) {
        if (number === this.midiSustOn) {
          sustainOnOff.set(!!value);
        } else if (number === this.midiSoftOn) {
          softOnOff.set(!!value);
        }
      } else if (name === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
        this.midiSamplePlayer.setTempo(data * get(tempoCoefficient));
      }
    };
}

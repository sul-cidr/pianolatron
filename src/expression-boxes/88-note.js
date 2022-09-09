/* eslint-disable camelcase */
import IntervalTree from "node-interval-tree";
import { get } from "svelte/store";
import { bassExpCurve, expressionParameters, trebleExpCurve } from "../stores";

import InAppExpressionizer from "./lib/in-app-expressionizer";
import { PedalingContinuousInput } from "./lib/pedaling";

export default class EightyEightNoteExpressionizer extends PedalingContinuousInput(
  InAppExpressionizer,
) {
  defaultNoteVelocity = 50;

  defaultExpressionParams = {
    tunable: {
      default_mf: 75,
      accent_f: 95, // snakebite velocity
      snakebite_extension: 200, // extension (in ms) before and after snakebite
      tracker_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2,
    },
  };

  startingExpState = {
    velocity: this.defaultExpressionParams.default_mf, // Velocity at last expression event
    time: 0.0, // Time (in ms) at last expression event
    snakebite_start: null,
    snakebite_stop: null, // Can be in the future due to tracker extension
  };

  // ? TODO: this method is shared with Duo-Art; perhaps DRY this up a bit?
  computeDerivedExpressionParams = () => {
    // These are the derived parameters, used to compute velocities, but should
    // not be adjusted via the expression controls
    const tunable =
      get(expressionParameters)?.tunable ||
      this.defaultExpressionParams.tunable;

    const { tracker_diameter, punch_ext_ratio } = tunable;

    return {
      tunable,
      tracker_extension: parseInt(tracker_diameter * punch_ext_ratio, 10),
    };
  };

  getVelocityAtTime = (time, expState) => {
    const { accent_f, default_mf } = this.expParams.tunable;
    const { snakebite_start, snakebite_stop } = expState;

    // XXX This probably can be simplified -- really need to check all the nulls?
    const isSnakebiteOn =
      (snakebite_start !== null && snakebite_stop === null) ||
      (snakebite_start !== null &&
        snakebite_stop !== null &&
        snakebite_stop > time);

    return isSnakebiteOn ? accent_f : default_mf;
  };

  extendControlHoles = (item) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[item.noteNumber];
    const { tracker_extension } = this.expParams;

    // The only control holes to which the tracker extension can be
    // meaningfully applied are the snakebite accents.
    // NOTE that the extension is applied to the note holes during playback
    // in the MidiEventHandler, but a modified version of this function
    // could be used to apply the extension prior to playback.
    // Note also that no extension is applied to pedal events, but this
    // could be done as well.
    if (ctrlFunc == null || item.velocity !== 0 || ctrlFunc !== "acc")
      return item;

    // Note that the delta values for all subsequent events would need to
    // change, if we wanted to generate valid MIDI (in JSON form)
    item.tick += tracker_extension;

    return item;
  };

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[noteNumber];

    if (ctrlFunc == null) return [panExpMap, expState]; // Usually these are damage holes

    // The length of the perforation matters for all control holes
    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    const { snakebite_extension } = this.expParams.tunable;
    if (ctrlFunc === "acc") {
      // Snakebite accents tend to be doubled -- do anything about this?
      if (velocity > 0) {
        expState.snakebite_start = Math.max(0, msgTime - snakebite_extension);

        // Add an entry to the expression Interval Tree for the previous
        // interval (when the velocity was lower)
        if (
          expState.snakebite_stop !== null &&
          expState.snakebite_start > expState.snakebite_stop
        ) {
          panExpMap.insert(
            expState.snakebite_stop,
            expState.snakebite_start,
            panVelocity,
          );
        }

        expState.snakebite_stop = null;
      } else {
        expState.snakebite_stop = msgTime + snakebite_extension;

        if (expState.snakebite_start < expState.snakebite_stop) {
          panExpMap.insert(
            expState.snakebite_start,
            expState.snakebite_stop,
            panVelocity,
          );
        }
      }
      expState.time = msgTime;
      expState.velocity = panVelocity;
    }

    return [panExpMap, expState];
  };

  buildNoteVelocitiesMap = () => {
    const expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs) => {
      const expressionCurve = [];

      const { default_mf } = this.expParams.tunable;

      // First build the velocity expression map from the control track only
      const [panExpMap] = ctrlTrackMsgs
        .filter(({ name }) => name === "Note on")
        .map(this.extendControlHoles)
        // Adding the tracker extension ticks to the ends of the fast cresc/
        // decresc holes will result in unordered events; resort them.
        .sort((a, b) => a.tick - b.tick)
        .reduce(this.panExpMapReducer, [
          new IntervalTree(),
          { ...this.startingExpState },
        ]);

      // Then update the expressionMap with velocities for the note events
      noteTrackMsgs
        .filter(({ name, velocity }) => name === "Note on" && !!velocity)
        .forEach(({ noteNumber: midiNumber, tick }) => {
          const msgTime = this.convertTicksAndTime(tick);

          let noteVelocity = panExpMap.search(msgTime, msgTime)[0];
          if (noteVelocity == null) {
            noteVelocity = default_mf;
          }

          if (tick in expressionMap) {
            expressionMap[tick][midiNumber] = noteVelocity;
          } else {
            expressionMap[tick] = {};
            expressionMap[tick][midiNumber] = noteVelocity;
          }
        });

      // Build the expression curve, which uses ticks (not ms)
      let expVelocity = null;
      const intervals = Array.from(panExpMap.inOrder());
      Object.values(intervals).forEach((interval) => {
        const expStartTick = this.convertTicksAndTime(interval.low, "tick");
        const expEndTick = this.convertTicksAndTime(interval.high, "tick");
        const thisVelocity = interval.data;

        // Add a segment of the curve at the default velocity from the start of
        // the piece to the first velocity control event.
        // XXX Also should do this from the final velocity control event to the
        // end of the piece (final tick)
        if (expVelocity === null) {
          expressionCurve.push([0, default_mf, 0]);
          expressionCurve.push([expStartTick, default_mf, interval.low]);
          expVelocity = default_mf;
        }
        if (thisVelocity !== expVelocity) {
          expressionCurve.push([expStartTick, thisVelocity, interval.low]);
        }
        expressionCurve.push([expEndTick, thisVelocity, interval.high]);
        expVelocity = thisVelocity;
      });

      return expressionCurve;
    };

    bassExpCurve.set(
      buildPanExpMap(this.bassNotesTrack, this.bassControlsTrack),
    );

    trebleExpCurve.set(
      buildPanExpMap(this.trebleNotesTrack, this.trebleControlsTrack),
    );

    return expressionMap;
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

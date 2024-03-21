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
      default_mf: {
        value: this.defaultNoteVelocity,
        alias: "default velocity",
        min: 0,
        max: 127,
        step: 1,
      },
      accent_f: {
        value: 90,
        alias: "accent velocity",
        min: 0,
        max: 127,
        step: 1,
      }, // velocity when snakebite accent is active
      snakebite_extension: { value: 200 }, // extension (in ms) before and after snakebite
      tracker_diameter: { value: 16.7 },
      punch_ext_ratio: { value: 0.75 },
      accelFtPerMin2: { value: 0.2 },
    },
  };

  startingExpState = {
    velocity: 0.0,
    time: 0.0, // time (in ms) at last expression event
    snakebite_start: null,
    snakebite_stop: null, // this can be in the future due to tracker extension
  };

  // ? TODO: this method is shared with Duo-Art; perhaps DRY this up a bit?
  computeDerivedExpressionParams = () => {
    this.startingExpState.velocity =
      get(expressionParameters)?.tunable.default_mf.value ||
      this.defaultExpressionParams.tunable.default_mf.value;

    const tunable =
      get(expressionParameters)?.tunable ||
      this.defaultExpressionParams.tunable;

    const { tracker_diameter, punch_ext_ratio } = tunable;

    const hydratedTunableParams = this.hydrateExpressionParams(tunable);

    return {
      tunable: hydratedTunableParams,
      tracker_extension: parseInt(
        tracker_diameter.value * punch_ext_ratio.value,
        10,
      ),
    };
  };

  getVelocityAtTime = (time, expState) => {
    const { accent_f, default_mf } = this.expParams.tunable;
    const { snakebite_start, snakebite_stop } = expState;

    const isSnakebiteOn =
      snakebite_start !== null &&
      (snakebite_stop === null || snakebite_stop > time);

    return isSnakebiteOn ? accent_f.value : default_mf.value;
  };

  extendControlHoles = (item) => {
    const ctrlFunc = this.ctrlMap[item.noteNumber];
    const { tracker_extension } = this.expParams;

    // The only control holes to which the tracker extension can be
    //  meaningfully applied are the snakebite accents.
    //  Note also that no extension is applied to pedal events, but this
    //  could be done as well.
    if (ctrlFunc == null || item.velocity !== 0 || ctrlFunc !== "acc")
      return item;

    item.tick += tracker_extension;

    return item;
  };

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    const ctrlFunc = this.ctrlMap[noteNumber];

    if (ctrlFunc == null) return [panExpMap, expState]; // Usually these are damage holes

    // The length of the perforation matters for all control holes
    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    const { snakebite_extension } = this.expParams.tunable;
    if (ctrlFunc === "acc") {
      // It's only necessary to handle one of the "bites" of a snakebite accent
      //  but handling both doesn't seem to cause problems
      if (velocity > 0) {
        expState.snakebite_start = Math.max(
          0,
          msgTime - snakebite_extension.value,
        );

        // Add an entry to the expression Interval Tree for the previous
        //  interval (when the velocity was lower)
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
        expState.snakebite_stop = msgTime + snakebite_extension.value;

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
        // Adding the tracker extension to the snakebite accents control hole
        //  events can result in unordered events; resort them.
        .sort((a, b) => a.tick - b.tick)
        .reduce(this.panExpMapReducer, [
          new IntervalTree(),
          { ...this.startingExpState },
        ]);

      const mapIntervals = Array.from(panExpMap.inOrder());
      const finalExpTime = mapIntervals[mapIntervals.length - 1].high;

      // Extend the expression map so that it extends from the accent event
      //  to the final note on this side of the roll (if needed)
      const finalTick = Math.max(
        noteTrackMsgs[noteTrackMsgs.length - 1].tick,
        ctrlTrackMsgs[ctrlTrackMsgs.length - 1].tick,
      );
      const finalTime = this.convertTicksAndTime(finalTick);

      if (finalTime > finalExpTime) {
        panExpMap.insert(finalExpTime, finalExpTime, default_mf.value);
        panExpMap.insert(finalExpTime, finalTime, default_mf.value);
      }

      noteTrackMsgs
        .filter(({ name, velocity }) => name === "Note on" && !!velocity)
        .forEach(({ noteNumber: midiNumber, tick }) => {
          const msgTime = this.convertTicksAndTime(tick);

          let noteVelocity = panExpMap.search(msgTime, msgTime)[0];
          if (noteVelocity == null) {
            noteVelocity = default_mf.value;
          }

          if (tick in expressionMap) {
            expressionMap[tick][midiNumber] = noteVelocity;
          } else {
            expressionMap[tick] = {};
            expressionMap[tick][midiNumber] = noteVelocity;
          }
        });

      let expVelocity = null;
      const intervals = Array.from(panExpMap.inOrder());
      Object.values(intervals).forEach((interval) => {
        const expStartTick = this.convertTicksAndTime(interval.low, "tick");
        const expEndTick = this.convertTicksAndTime(interval.high, "tick");
        const thisVelocity = interval.data;

        // Add a segment of the curve at the default velocity from the start of
        //  the piece to the first velocity control event.
        // ? XXX Should we also do this from the final velocity control event
        // ? to the end of the piece (final tick)?
        if (expVelocity === null) {
          expressionCurve.push([0, default_mf.value, 0]);
          expressionCurve.push([expStartTick, default_mf.value, interval.low]);
          expVelocity = default_mf.value;
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

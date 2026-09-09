/* eslint-disable camelcase */
import IntervalTree from "node-interval-tree";
import { get } from "svelte/store";
import { bassExpCurve, expressionParameters, trebleExpCurve } from "../stores";

import InAppExpressionizer from "./lib/in-app-expressionizer";
import { PedalingContinuousInput } from "./lib/pedaling";

export default class EightyEightNoteExpressionizer extends PedalingContinuousInput(
  InAppExpressionizer,
) {
  defaultExpressionParams = {
    tunable: {
      default_mf: {
        value: 50,
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
    //  meaningfully applied are the snakebite accents and the sustain
    //  pedal events.
    if (
      ctrlFunc == null ||
      item.velocity !== 0 ||
      !["acc", "sust_off"].includes(ctrlFunc)
    )
      return item;

    item.tick += tracker_extension;

    return item;
  };

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
    reduceIndex, inputMap
  ) => {
    const ctrlFunc = this.ctrlMap[noteNumber];

    // Upon reaching the final control message (whatever it is), add a
    //  transition back to mf from the end of the last snakebite accent section
    //  (if there was one). This ensures that the velocity doesn't erroneously
    //  stay at the accented forte level until the end of the roll.
    if ((reduceIndex === inputMap.length - 1) && (expState.snakebite_stop !== null)) {
      panExpMap.insert(
        expState.snakebite_stop,
        expState.snakebite_stop,
        [
          this.expParams.tunable.accent_f.value,
          this.expParams.tunable.default_mf.value,
          expState.snakebite_stop,
          expState.snakebite_stop,
        ]
      );

      expState.time = expState.snakebite_stop;
      expState.velocity = this.expParams.tunable.default_mf.value;

      return [panExpMap, expState]; 
    }

    // Usually these are damage holes
    if (ctrlFunc == null) return [panExpMap, expState];

    // The length of the perforation matters for all control holes
    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    const { accent_f, default_mf, snakebite_extension } = this.expParams.tunable;
    if (ctrlFunc === "acc") {
      // It's only necessary to handle one of the "bites" of a snakebite accent
      //  but handling both doesn't seem to cause problems
      if (velocity > 0) {
        expState.snakebite_start = Math.max(
          0,
          msgTime - snakebite_extension.value,
        );

        // This makes sure that there's an interval at default mf from the
        //  beginning of the roll up until the first accent appears.
        if ((expState.snakebite_stop === null) && (expState.time < expState.snakebite_start))
          panExpMap.insert(
            expState.time,
            expState.snakebite_start,
            [
              default_mf.value,
              default_mf.value,
              expState.time,
              expState.snakebite_start,
            ]
          )
        // Add an entry to the expression map (Interval Tree) at default mf
        //  from the end of the last snakebite accent section to the beginning
        //  of this one.
        if (
          expState.snakebite_stop !== null &&
          expState.snakebite_start > expState.snakebite_stop
        ) {
          panExpMap.insert(
            expState.snakebite_stop,
            expState.snakebite_start,
            [
              default_mf.value,
              default_mf.value,
              expState.snakebite_stop,
              expState.snakebite_start,
            ]
          );
        }
        expState.snakebite_stop = null;
      } else {
        expState.snakebite_stop = msgTime + snakebite_extension.value;

        // Section at accent forte for the duration of the snakebite region
        if (expState.snakebite_start < expState.snakebite_stop) {
          panExpMap.insert(
            expState.snakebite_start,
            expState.snakebite_stop,
            [
              accent_f.value,
              accent_f.value,
              expState.snakebite_start,
              expState.snakebite_stop,
            ]
          );
        }
      }
      expState.time = msgTime;
      expState.velocity = panVelocity;
    } 

    return [panExpMap, expState];
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

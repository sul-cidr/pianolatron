/* eslint-disable camelcase */
import { get } from "svelte/store";
import { expressionParameters } from "../stores";

import InAppExpressionizer from "./lib/in-app-expressionizer";
import { PedalingContinuousInput } from "./lib/pedaling";

export default class DuoArtExpressionizer extends PedalingContinuousInput(
  InAppExpressionizer,
) {
  defaultExpressionParams = {
    tunable: {
      // TODO Should get rid of the "welte" for these, or hardcode them
      //  into the overlay viz module if they shouldn't affect the emulation
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,

      // XXX should the effect of the "theme" holes also extend *before* the
      //  beginning of the snakebite accent holes, as for 88-note rolls?
      theme_extent: 20, // effective ms after theme selector snakebites
      left_adjust: -5.0, // used for Welte rolls, apply it here as well?
      tracker_diameter: 16.7, // TODO get value from P. Phillips dissertation
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2,
    },
  };

  startingExpState = {
    velocity: 0.0, // velocity at last cresc/decresc event
    time: 0.0, // time (in ms) at last cresc/decresc event
    theme_start: null,
    theme_stop: null,
    vol1_start: null,
    vol1_stop: null,
    vol2_start: null,
    vol2_stop: null,
    vol4_start: null,
    vol4_stop: null,
    vol8_start: null,
    vol8_stop: null,
  };

  computeDerivedExpressionParams = () => {
    const tunable =
      get(expressionParameters)?.tunable ||
      this.defaultExpressionParams.tunable;

    const { tracker_diameter, punch_ext_ratio } = tunable;

    return {
      tunable,
      tracker_extension: parseInt(tracker_diameter * punch_ext_ratio, 10),
    };
  };

  // ? TODO: refactor
  // eslint-disable-next-line class-methods-use-this
  getVelocityAtTime = (_, expState) => {
    const convertStepToPressure = (step, isTheme) => {
      // Mappings from volume "steps" to pressure values are from
      // https://www.youtube.com/watch?v=w-XrDw04P2M&t=218s
      const accompanimentStepMap = {
        0: 4,
        1: 5,
        2: 7,
        3: 9,
        4: 10,
        5: 12,
        6: 13,
        7: 14,
        8: 15,
        9: 16,
        10: 18,
        11: 20,
        12: 21,
        13: 23,
        14: 25,
        15: 27,
      };

      const themeStepMap = {
        0: 5,
        1: 6,
        2: 8,
        3: 9,
        4: 10,
        5: 13,
        6: 14,
        7: 16,
        8: 18,
        9: 20,
        10: 23,
        11: 25,
        12: 26,
        13: 29,
        14: 31,
        15: 33, // Could be 40???
      };

      if (!isTheme) {
        return accompanimentStepMap[step];
      }
      return themeStepMap[step];
    };

    let newVelocity = expState.velocity;

    const isTheme = expState.theme_start !== null;

    let step = 0;

    if (expState.vol1_start !== null) {
      step += 1.0;
    }
    if (expState.vol2_start !== null) {
      step += 2.0;
    }
    if (expState.vol4_start !== null) {
      step += 4.0;
    }
    if (expState.vol8_start !== null) {
      step += 8.0;
    }

    const pressure = convertStepToPressure(step, isTheme);

    if (pressure <= 10) {
      newVelocity = pressure * 5.8 + 6.0;
    } else if (pressure > 10 && pressure <= 25) {
      newVelocity = pressure * 1.4 + 50;
    } else {
      newVelocity = 90;
    }

    return newVelocity;
  };

  extendControlHoles = (item) => {
    const ctrlFunc = this.ctrlMap[item.noteNumber];
    const {
      tunable: { theme_extent },
      tracker_extension,
    } = this.expParams;

    if (
      ctrlFunc === null ||
      !["acc", "vol+1", "vol+2", "vol+4", "vol+8"].includes(ctrlFunc)
    )
      return item;

    if (ctrlFunc === "acc") {
      if (item.velocity !== 0) {
        item.tick = Math.max(0, item.tick - theme_extent * 0.5);
      } else {
        item.tick += theme_extent;
      }
    } else if (item.velocity === 0) {
      item.tick += tracker_extension;
    }

    return item;
  };

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[noteNumber];

    // Ignore control holes that don't affect playback (most roll types
    //  will have some of these), or are likely to be damage holes
    if (!["acc", "vol+1", "vol+2", "vol+4", "vol+8"].includes(ctrlFunc))
      return [panExpMap, expState]; // Usually these are damage holes

    // The length of the perforation matters for all control holes
    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    const { theme_extent } = this.expParams.tunable;

    switch (ctrlFunc) {
      case "acc":
        if (velocity > 0) {
          expState.theme_start = Math.max(0, msgTime - theme_extent * 0.1);
          expState.theme_stop = null;
        } else {
          expState.theme_stop = msgTime + theme_extent;
        }
        break;

      case "vol+1":
      case "vol+2":
      case "vol+4":
      case "vol+8":
        if (velocity > 0) {
          expState[`vol${ctrlFunc.slice(-1)}_start`] = msgTime;
          expState[`vol${ctrlFunc.slice(-1)}_stop`] = null;
        } else {
          expState[`vol${ctrlFunc.slice(-1)}_start`] = null;
          expState[`vol${ctrlFunc.slice(-1)}_stop`] = msgTime;
        }
        break;

      default:
        break;
    }

    panExpMap.insert(expState.time, msgTime, [
      expState.velocity,
      expState.velocity,
      expState.time,
      msgTime,
    ]);

    panExpMap.insert(msgTime, msgTime, [
      expState.velocity,
      panVelocity,
      expState.time,
      msgTime,
    ]);

    expState.time = msgTime;
    expState.velocity = panVelocity;

    return [panExpMap, expState];
  };

  initializeExpressionizer = () => {
    this.startingExpState.velocity =
      this.defaultExpressionParams.tunable.welte_p;
    super.initializeExpressionizer();
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

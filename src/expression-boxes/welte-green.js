import InAppExpressionizer from "./in-app-expressionizer";

export default class WelteGreenExpressionizer extends InAppExpressionizer {
  defaultExpressionParams = {
    tunable: {
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,
      welte_loud: 75.0,
      left_adjust: -5.0, // This is a kludge for the Disklavier, could be 0.0
      slow_decay_rate: 2455, // Probably this is 1 velocity step in 2.455s
      fastC_decay_rate: 245,
      fastD_decay_rate: 269,
      tracker_diameter: 16.7, // in ticks (px = 1/300 in)
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2, // XXX Double check
    },
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

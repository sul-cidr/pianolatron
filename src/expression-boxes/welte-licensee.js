import WelteRedExpressionizer from "./welte-red";

export default class WelteLicenseeExpressionizer extends WelteRedExpressionizer {
  // WelteLicenseeExpressionizer inherits from WelteRedExpressionizer --
  //  -- only some default expression parameters are different.
  defaultExpressionParams = {
    tunable: {
      welte_p: 35.0,
      welte_mf: 60.0,
      welte_f: 90.0,
      welte_loud: 75.0,
      left_adjust: -5.0, // bass notes can be a bit too loud (kind of a kludge)
      slow_decay_rate: 2163, // 1 velocity step in 2.163s
      fastC_decay_rate: 220,
      fastD_decay_rate: 186,
      tracker_diameter: 10.8, // P. Phillips: .5 mm smaller than Welte-Mignon
      punch_ext_ratio: 0.75,
      accelFtPerMin2: 0.2,
    },
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

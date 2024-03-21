import WelteRedExpressionizer from "./welte-red";

export default class WelteLicenseeExpressionizer extends WelteRedExpressionizer {
  // WelteLicenseeExpressionizer inherits from WelteRedExpressionizer --
  //  -- only some default expression parameters are different.
  defaultExpressionParams = {
    tunable: {
      welte_p: { value: 35.0 },
      welte_mf: { value: 60.0 },
      welte_f: { value: 90.0 },
      welte_loud: { value: 75.0 },
      left_adjust: { value: -5.0 }, // bass notes can be a bit too loud (kind of a kludge)
      slow_decay_rate: { value: 2163 }, // 1 velocity step in 2.163s
      fastC_decay_rate: { value: 220 },
      fastD_decay_rate: { value: 186 },
      tracker_diameter: { value: 10.8 }, // P. Phillips: .5 mm smaller than Welte-Mignon
      punch_ext_ratio: { value: 0.75 },
      accelFtPerMin2: { value: 0.2 },
    },
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

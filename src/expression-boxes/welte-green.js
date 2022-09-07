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

  extendControlHoles = (item) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[item.noteNumber];

    // We're only interested in the ends of control holes.
    // No extension is applied to pedal events, but this could be done
    // as well.
    if (
      ctrlFunc == null ||
      item.velocity !== 0 ||
      !["sfp", "mf", "cresc", "sff"].includes(ctrlFunc)
    )
      return item;

    // Note that the delta values for all subsequent events would need to
    // change, if we wanted to generate valid MIDI (in JSON form)
    item.tick += this.expParams.tracker_extension;

    return item;
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

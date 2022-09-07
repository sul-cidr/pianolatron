import InAppExpressionizer from "./in-app-expressionizer";

export default class WelteRedExpressionizer extends InAppExpressionizer {
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

  extendControlHoles = (item) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[item.noteNumber];

    // We're only interested in the ends of control holes, and specifically
    // only the ends of fast cresc or decresc holes (for now)
    // NOTE that the extension is applied to the note holes during playback
    // in the MidiEventHandler, but a modified version of this function
    // could be used to apply the extension prior to playback.
    // Note also that no extension is applied to pedal events, but this
    // could be done as well.
    if (
      ctrlFunc == null ||
      item.velocity !== 0 ||
      !["sf_on", "sf_off"].includes(ctrlFunc)
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

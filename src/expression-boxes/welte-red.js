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

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[noteNumber];

    // Ignore control holes that don't affect playback (most roll types
    // will have some of these), or are likely to be damage holes
    if (
      !["sf_on", "sf_off", "cresc_on", "cresc_off", "mf_on", "mf_off"].includes(
        ctrlFunc,
      )
    )
      return [panExpMap, expState]; // Usually these are damage holes

    // Fast crescendo and decrescendo controls are the only ones for which
    // the length of the perforation matters
    if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc))
      return [panExpMap, expState];

    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    switch (ctrlFunc) {
      case "mf_on":
        expState.mf_start = msgTime;
        break;

      case "mf_off":
        expState.mf_start = null;
        break;

      case "cresc_on":
        expState.slow_cresc_start = msgTime;
        expState.slow_decresc_start = null;
        break;

      case "cresc_off":
        expState.slow_cresc_start = null;
        expState.slow_decresc_start = msgTime;
        break;

      case "sf_on":
        if (velocity > 0) {
          expState.fast_cresc_start = msgTime;
          expState.fast_cresc_stop = null;
        } else {
          expState.fast_cresc_stop = msgTime;
        }
        break;

      case "sf_off":
        if (velocity > 0) {
          expState.fast_decresc_start = msgTime;
          expState.fast_decresc_stop = null;
        } else {
          expState.fast_decresc_stop = msgTime;
        }
        break;

      default:
        break;
    }

    panExpMap.insert(expState.time, msgTime, [
      expState.velocity,
      panVelocity,
      expState.time,
      msgTime,
    ]);

    expState.time = msgTime;
    expState.velocity = panVelocity;

    return [panExpMap, expState];
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

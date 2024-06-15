import InAppExpressionizer from "./lib/in-app-expressionizer";
import { ExpressionWelteMignon } from "./lib/expression-welte-mignon";
import { PedalingLockAndCancel } from "./lib/pedaling";

export default class WelteRedExpressionizer extends ExpressionWelteMignon(
  PedalingLockAndCancel(InAppExpressionizer),
) {
  defaultExpressionParams = {
    tunable: {
      welte_p: { value: 35.0 },
      welte_mf: { value: 60.0 },
      welte_f: { value: 90.0 },
      welte_loud: { value: 75.0 },
      left_adjust: { value: -5.0 }, // bass notes can be a bit too loud (kind of a kludge)
      slow_decay_rate: { value: 2380 }, // rates are in steps/ms, i.e., 1 step in 2.38s
      fastC_decay_rate: { value: 300 },
      fastD_decay_rate: { value: 400 },
      tracker_diameter: { value: 16.7 }, // measured in pixels =~ ticks (1 = 1/300 in)
      punch_ext_ratio: { value: 0.75 },
      accelFtPerMin2: { value: 0.3147 },
    },
  };

  extendControlHoles = (item) => {
    const ctrlFunc = this.ctrlMap[item.noteNumber];

    // Extend the ending events (confusingly, these are encoded as "Note On"
    //  MIDI events, but are distinguished as ending events by having a
    //  velocity = 0) of the control holes for which the length of the hole
    //  determines its effect (only fast cresc or decresc holes for red Welte).
    //  Note that the extension also is applied to the note holes during
    //  playback in the MidiEventHandler. A modified version of this
    //  function could be used to apply the extension prior to playback.
    if (
      ctrlFunc == null ||
      item.velocity !== 0 ||
      !["sf_on", "sf_off", "sust_off", "soft_off"].includes(ctrlFunc)
    )
      return item;

    // Note that the delta values for all subsequent events would need to be
    //  adjusted, if we wanted to export these modified control hole events as
    //  valid MIDI.
    item.tick += this.expParams.tracker_extension;

    return item;
  };

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    const ctrlFunc = this.ctrlMap[noteNumber];

    // Ignore control holes that don't affect playback (most roll types
    //  will have some of these)
    if (
      !["sf_on", "sf_off", "cresc_on", "cresc_off", "mf_on", "mf_off"].includes(
        ctrlFunc,
      )
    )
      return [panExpMap, expState]; // most often, these are damage holes

    // Fast crescendo and decrescendo controls are the only ones for which
    //  the length of the perforation matters. For the rest, we can ignote
    //  the "end of hole" events.
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

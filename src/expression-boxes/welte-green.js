import IntervalTree from "node-interval-tree";
import { softOnOff, sustainOnOff } from "../stores";
import { getKeyByValue } from "../lib/utils";
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

  panExpMapReducer = (
    [panExpMap, expState],
    { noteNumber, velocity, tick },
  ) => {
    // We know these are all control holes
    const ctrlFunc = this.ctrlMap[noteNumber];

    // Ignore control holes that don't affect playback (most roll types
    // will have some of these), or are likely to be damage holes
    if (!["sfp", "mf", "cresc", "sff"].includes(ctrlFunc))
      return [panExpMap, expState]; // Usually these are damage holes

    // The length of the perforation matters for all control holes
    const msgTime = this.convertTicksAndTime(tick);
    const panVelocity = this.getVelocityAtTime(msgTime, expState);

    switch (ctrlFunc) {
      case "mf":
        if (velocity > 0) {
          expState.mf_start = msgTime;
          expState.mf_stop = null;
        } else {
          expState.mf_stop = msgTime;
        }
        break;

      case "sfp":
        if (velocity > 0) {
          expState.fast_decresc_start = msgTime;
          expState.fast_decresc_stop = null;
        } else {
          expState.fast_decresc_stop = msgTime;
        }
        break;

      case "cresc":
        if (velocity > 0) {
          expState.slow_cresc_start = msgTime;
          expState.slow_decresc_start = null;
        } else {
          expState.slow_cresc_start = null;
          expState.slow_decresc_start = msgTime;
        }
        break;

      case "sff":
        if (velocity > 0) {
          expState.fast_cresc_start = msgTime;
          expState.fast_cresc_stop = null;
        } else {
          expState.fast_cresc_stop = msgTime;
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

  buildPedalingMap = () => {
    const midiSoft = getKeyByValue(this.ctrlMap, "soft");
    const midiSust = getKeyByValue(this.ctrlMap, "sust");

    const pedalingMap = new IntervalTree();

    const registerPedalEvents = (track, pedalOn, eventNumber) => {
      let tickOn = false;
      track
        // Pedal is on as long as the punch is present
        .filter(({ name }) => name === "Note on")
        .forEach(({ noteNumber, tick, velocity }) => {
          if (noteNumber === pedalOn) {
            if (velocity === 0) {
              // Holes can legitimately begin on tick 0
              if (tickOn !== false)
                pedalingMap.insert(tickOn, tick, eventNumber);
              tickOn = false;
            } else if (velocity === 1) {
              if (!tickOn) tickOn = tick;
            }
          }
        });
    };

    registerPedalEvents(this.bassControlsTrack, midiSoft, this.midiSoftPedal);
    registerPedalEvents(this.trebleControlsTrack, midiSust, this.midiSustPedal);

    return pedalingMap;
  };

  handlePedal = (velocity, midiNumber) => {
    switch (this.ctrlMap[midiNumber]) {
      case "sust":
        sustainOnOff.set(!!velocity);
        break;

      case "soft":
        softOnOff.set(!!velocity);
        break;

      default:
        break;
    }
  };

  constructor(...args) {
    super(...args);
    this.initializeExpressionizer();
  }
}

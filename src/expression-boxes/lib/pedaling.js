/* eslint-disable max-classes-per-file */
import IntervalTree from "node-interval-tree";
import { softOnOff, sustainOnOff } from "../../stores";
import { getKeyByValue } from "../../lib/utils";

export const PedalingLockAndCancel = (SuperClass) =>
  class extends SuperClass {
    // Pedaling is represented by an "on" hole and an "off" hole
    //  e.g. Welte-Red, Welte-Licensee

    buildPedalingMap = () => {
      const midiSoftOn = parseInt(getKeyByValue(this.ctrlMap, "soft_on"), 10);
      const midiSoftOff = parseInt(getKeyByValue(this.ctrlMap, "soft_off"), 10);
      const midiSustOn = parseInt(getKeyByValue(this.ctrlMap, "sust_on"), 10);
      const midiSustOff = parseInt(getKeyByValue(this.ctrlMap, "sust_off"), 10);

      const pedalingMap = new IntervalTree();

      const registerPedalEvents = (track, pedalOn, pedalOff, eventNumber) => {
        let tickOn = false;
        track
          // Only want beginning of note holes for lock & cancel type expression
          // mechanisms (works for Welte red and Licensee, not 88 or Welte green)
          .filter(({ name, velocity }) => name === "Note on" && velocity === 1)
          .forEach(({ noteNumber, tick }) => {
            if (noteNumber === pedalOff) {
              // Holes can legitimately begin on tick 0
              if (tickOn !== false)
                pedalingMap.insert(tickOn, tick, eventNumber);
              tickOn = false;
            } else if (noteNumber === pedalOn) {
              if (tickOn === false) tickOn = tick;
            }
          });
      };

      registerPedalEvents(
        this.bassControlsTrack,
        midiSoftOn,
        midiSoftOff,
        this.midiSoftPedal,
      );

      registerPedalEvents(
        this.trebleControlsTrack,
        midiSustOn,
        midiSustOff,
        this.midiSustPedal,
      );

      return pedalingMap;
    };

    handlePedal = (velocity, midiNumber) => {
      if (velocity === 0) {
        // Length of pedal control holes doesn't matter for red Welte (but it
        //  does for green Welte, as well as Duo-Art, some 88-note rolls, and
        //  others...)
        return;
      }

      switch (this.ctrlMap[midiNumber]) {
        case "sust_on":
          sustainOnOff.set(true);
          break;

        case "sust_off":
          sustainOnOff.set(false);
          break;

        case "soft_on":
          softOnOff.set(true);
          break;

        case "soft_off":
          softOnOff.set(false);
          break;

        default:
          break;
      }
    };
  };

export const PedalingContinuousInput = (SuperClass) =>
  class extends SuperClass {
    // Pedaling is represented by a single hole per pedal event
    //  whose extension indicates the duration of the pedaling
    //  e.g. Welte-Green, Duo-Art, also 88-note occasionally

    buildPedalingMap = () => {
      const midiSoft = parseInt(getKeyByValue(this.ctrlMap, "soft"), 10);
      const midiSust = parseInt(getKeyByValue(this.ctrlMap, "sust"), 10);
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
                if (tickOn === false) tickOn = tick;
              }
            }
          });
      };

      // Although the lock-and-cancel Welte types (red and licensee) have the
      //  soft pedal controls on the left/bass side and sustain on the right/
      //  treble, green Welte has the sustain on the left/bass and soft on the
      //  right/treble. As for the other roll types with continuous pedal punches,
      //  Duo-Art has soft on the left, sustain on the right, as do Ampico A and
      //  B, while 88-note rolls have sustain on the left (and no soft control)!
      //  So it's easiest just to search all pedal control events on both
      //  (left and right) control tracks for all of these types of rolls,
      //  rather than trying to hard-code the preferred sides for each roll type.

      registerPedalEvents(this.bassControlsTrack, midiSoft, this.midiSoftPedal);
      registerPedalEvents(
        this.trebleControlsTrack,
        midiSoft,
        this.midiSoftPedal,
      );
      registerPedalEvents(this.bassControlsTrack, midiSust, this.midiSustPedal);
      registerPedalEvents(
        this.trebleControlsTrack,
        midiSust,
        this.midiSustPedal,
      );

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
  };

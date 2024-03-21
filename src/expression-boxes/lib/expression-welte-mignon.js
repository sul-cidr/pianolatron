/* eslint-disable camelcase */
import { get } from "svelte/store";
import { expressionParameters } from "../../stores";
import { clamp } from "../../lib/utils";

export const ExpressionWelteMignon = (BaseClass) =>
  class extends BaseClass {
    startingExpState = {
      velocity: 0.0, // velocity at last cresc/decresc event
      time: 0.0, // time (in ms) at last cresc/decresc event
      mf_start: null,
      slow_cresc_start: null,
      slow_decresc_start: null,
      fast_cresc_start: null,
      fast_cresc_stop: null,
      fast_decresc_start: null,
      fast_decresc_stop: null,
    };

    computeDerivedExpressionParams = () => {
      this.startingExpState.velocity =
        get(expressionParameters)?.tunable.welte_p.value ||
        this.defaultExpressionParams.tunable.welte_p.value;

      // The derived parameters are computed from the tunable parameters and
      //  are used to calculate the expression velocities, but cannot be
      //  directly adjusted via the expression settings controls
      const tunable =
        get(expressionParameters)?.tunable ||
        this.defaultExpressionParams.tunable;

      const {
        welte_f,
        welte_mf,
        welte_p,
        slow_decay_rate,
        fastC_decay_rate,
        fastD_decay_rate,
        tracker_diameter,
        punch_ext_ratio,
      } = tunable;

      const hydratedTunableParams = this.hydrateExpressionParams(tunable);

      return {
        tunable: hydratedTunableParams,
        slow_step: (welte_mf.value - welte_p.value) / slow_decay_rate.value,
        fastC_step: (welte_mf.value - welte_p.value) / fastC_decay_rate.value,
        fastD_step: -(welte_f.value - welte_p.value) / fastD_decay_rate.value,
        tracker_extension: parseInt(
          tracker_diameter.value * punch_ext_ratio.value,
          10,
        ),
      };
    };

    getVelocityAtTime = (time, expState) => {
      const { slow_step, fastC_step, fastD_step, tunable } = this.expParams;
      const { welte_f, welte_loud, welte_mf, welte_p } = tunable;

      // To begin, the new velocity is set to the previous level
      let newVelocity = expState.velocity;
      const msFromLastDynamic = time - expState.time;

      // Determine fast crescendo and decrescendo states at this time, handling
      //  cases in which the fast change is still happening (the hole hasn't
      //  ended yet).
      const isFastCrescOn =
        expState.fast_cresc_start !== null && expState.fast_cresc_stop === null;
      const isFastDecrescOn =
        expState.fast_decresc_start !== null &&
        expState.fast_decresc_stop === null;

      // Slow decresc is on by default if none of slow cresc, fast cresc/decresc
      //  is enabled
      if (
        expState.slow_cresc_start === null &&
        !isFastCrescOn &&
        !isFastDecrescOn
      ) {
        newVelocity -= msFromLastDynamic * slow_step;
      } else {
        // Otherwise new target velocity will be a combination of the
        // active control effects (slow cresc, fast cresc or fast decresc)
        newVelocity +=
          expState.slow_cresc_start !== null
            ? msFromLastDynamic * slow_step
            : 0;
        newVelocity += isFastCrescOn ? msFromLastDynamic * fastC_step : 0;
        newVelocity += isFastDecrescOn ? msFromLastDynamic * fastD_step : 0;
      }

      // When enabled, the mezzo-forte hook prevents the velocity level from
      //  crossing welte_mf during either a cresc or decresc
      const velocityDelta = newVelocity - expState.velocity;
      if (expState.mf_start !== null) {
        // If the previous velocity was above MF, keep it there
        if (expState.velocity > welte_mf.value) {
          newVelocity =
            velocityDelta < 0
              ? Math.max(welte_mf.value + 0.001, newVelocity)
              : Math.min(welte_f.value, newVelocity);
          // If the previous velocity was below MF, keep it there
        } else if (expState.velocity < welte_mf.value) {
          newVelocity =
            velocityDelta > 0
              ? Math.min(welte_mf.value - 0.001, newVelocity)
              : Math.max(welte_p.value, newVelocity);
        }
      } else if (
        expState.slow_cresc_start !== null &&
        !isFastCrescOn &&
        expState.velocity < welte_loud.value
      ) {
        // If the MF hook is off and only slow crescendo is on, the velocity
        //  should never exceed welte_loud (which is lower than welte_f)
        newVelocity = Math.min(newVelocity, welte_loud.value - 0.001);
      }

      // Ensure the velocity always stays between welte_p and welte_f
      newVelocity = clamp(newVelocity, welte_p.value, welte_f.value);

      return newVelocity;
    };
  };

import { optionsFromArguments, Reverb } from "tone";
import { Piano as ToneJsPiano, PianoStrings } from "./tonejs-piano";

export class Piano extends ToneJsPiano {
  constructor(...args) {
    const options = optionsFromArguments(Piano.getDefaults(), args);
    super(options);
    this.options = options;
    this.reverb = new Reverb({ wet: options.reverbWet }).toDestination();
    this.connect(this.reverb);
  }

  get loadedVelocities() {
    return this._strings._strings.length;
  }

  updateReverb(wet) {
    this.reverb.dispose();
    this.reverb = new Reverb({ wet }).toDestination();
    this.connect(this.reverb);
  }

  updateVelocities(velocities) {
    if (this._strings.loaded) {
      this._strings.dispose();
      this._strings = new PianoStrings({
        ...this.options,
        velocities,
        enabled: true,
        samples: this.options.url,
        volume: this.options.volume.strings,
      }).connect(this.output);
      this.strings = this._strings.volume;
      return this._strings.load();
    }
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({ loadedVelocities: this.loadedVelocities });
  }

  updateVolumes({ strings, harmonics, pedal, keybed }) {
    this.strings.value = strings;
    this.harmonics.value = harmonics;
    this.pedal.value = pedal;
    this.keybed.value = keybed;
  }
}

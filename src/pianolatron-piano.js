import { Piano as ToneJsPiano } from "./tonejs-piano";

export class Piano extends ToneJsPiano {
  updateVolumes({ strings, harmonics, pedal, keybed }) {
    this.strings.value = strings;
    this.harmonics.value = harmonics;
    this.pedal.value = pedal;
    this.keybed.value = keybed;
  }
}

import {
  volumeCoefficient,
  bassVolumeCoefficient,
  trebleVolumeCoefficient,
  tempoCoefficient,
} from "../stores";

export const controlsConfig = {
  volume: {
    store: volumeCoefficient,
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  bassVolume: {
    store: bassVolumeCoefficient,
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  trebleVolume: {
    store: trebleVolumeCoefficient,
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  tempo: {
    store: tempoCoefficient,
    min: 0.1,
    max: 3,
    delta: 0.05,
    augmentedDelta: 0.1,
    precision: 2,
  },
};

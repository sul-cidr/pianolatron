import {
  volumeCoefficient,
  bassVolumeCoefficient,
  trebleVolumeCoefficient,
  tempoCoefficient,
} from "../stores";

export const defaultControlsConfig = {
  volume: {
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  bassVolume: {
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  trebleVolume: {
    min: 0,
    max: 4,
    delta: 0.1,
    augmentedDelta: 0.4,
    precision: 2,
  },
  tempo: {
    min: 0.1,
    max: 3,
    delta: 0.05,
    augmentedDelta: 0.1,
    precision: 2,
  },
  transpose: {
    min: -6,
    max: 6,
    delta: 1,
    augmentedDelta: 1,
    precision: 0
  }
};

export const controlsStores = {
  volume: volumeCoefficient,
  bassVolume: bassVolumeCoefficient,
  trebleVolume: trebleVolumeCoefficient,
  tempo: tempoCoefficient,
};

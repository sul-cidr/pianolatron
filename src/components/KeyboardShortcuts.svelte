<script>
  import { pedalling, volume, tempoControl } from "../stores";

  const keyMap = Object.freeze({
    SOFT: "KeyQ",
    SUSTAIN: "KeyC",
    VOLUME_UP: "BracketRight",
    VOLUME_DOWN: "BracketLeft",
    TEMPO_UP: "KeyE",
    TEMPO_DOWN: "KeyW",
  });

  const enforcePrecision = (value, precision) => {
    const multiplier = 10 ** (precision || 0);
    return Math.round(value * multiplier) / multiplier;
  };
</script>

<svelte:window
  on:keydown={({ code }) => {
    switch (code) {
      case keyMap.SOFT:
        $pedalling.soft = true;
        break;

      case keyMap.SUSTAIN:
        $pedalling.sustain = true;
        break;

      case keyMap.VOLUME_UP:
        $volume.master = enforcePrecision($volume.master + 0.1, 1);
        break;

      case keyMap.VOLUME_DOWN:
        $volume.master = enforcePrecision($volume.master - 0.1, 1);
        break;

      case keyMap.TEMPO_UP:
        $tempoControl = enforcePrecision($tempoControl + 0.01, 2);
        break;

      case keyMap.TEMPO_DOWN:
        $tempoControl = enforcePrecision($tempoControl - 0.01, 2);
        break;

      // no default
    }
  }}
  on:keyup={({ code }) => {
    switch (code) {
      case keyMap.SOFT:
        $pedalling.soft = false;
        break;

      case keyMap.SUSTAIN:
        $pedalling.sustain = false;
        break;

      // no default
    }
  }}
/>

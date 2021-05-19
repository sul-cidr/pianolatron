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
        $volume.master = Math.round(($volume.master + 0.1) * 10) / 10;
        break;

      case keyMap.VOLUME_DOWN:
        $volume.master = Math.round(($volume.master - 0.1) * 10) / 10;
        break;

      case keyMap.TEMPO_UP:
        $tempoControl = Math.round(($tempoControl + 0.01) * 100) / 100;
        break;

      case keyMap.TEMPO_DOWN:
        $tempoControl = Math.round(($tempoControl - 0.01) * 100) / 100;
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

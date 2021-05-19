<script>
  import { pedalling, volume } from "../stores";

  const keyMap = Object.freeze({
    SOFT: "KeyQ",
    SUSTAIN: "KeyC",
    VOLUME_UP: "BracketRight",
    VOLUME_DOWN: "BracketLeft",
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
        $volume.master += 0.1;
        break;

      case keyMap.VOLUME_DOWN:
        $volume.master -= 0.1;
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

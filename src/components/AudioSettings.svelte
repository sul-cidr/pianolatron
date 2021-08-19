<style lang="scss">
  div#settings-panel {
    @include background;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;

    div + div {
      margin-top: 1em;
    }
  }

  fieldset {
    margin: 2em 0;
    padding: 1em 0.75em;

    div {
      display: flex;
      justify-content: space-between;
    }
  }

  legend {
    font-family: $primary-typeface;
    font-size: 1.4em;
  }
</style>

<script>
  import { fly } from "svelte/transition";
  import { userSettings } from "../stores";

  import RangeSlider from "../ui-components/RangeSlider.svelte";

  let el;
</script>

<div
  id="audio-panel"
  bind:this={el}
  transition:fly|local={{
    delay: 0,
    duration: 300,
    x: parseInt(window.getComputedStyle(el).width, 10),
    y: 0,
    opacity: 1,
  }}
>
  <fieldset>
    <legend>Audio Settings</legend>
    <div>Velocities</div>
    <div>
      Display Note Velocities:
      <!-- <input type="checkbox" bind:checked={$userSettings.showNoteVelocities} /> -->
    </div>
    >
  </fieldset>
</div>

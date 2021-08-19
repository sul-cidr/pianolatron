<style lang="scss">
  div#audio-panel {
    @include background;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    overflow-y: auto;

    div + div {
      margin-top: 1em;
    }
  }
  .control {
    align-items: center;
    display: grid;
    gap: 0.5em;
    padding: 0 0.5em 0.5em;
    grid:
      "title value" auto
      "slider slider" auto / 1fr auto;

    :global(input[type="range"]) {
      grid-area: slider;
      width: 100%;
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
  import { sampleVolumes, sampleVelocities, reverbWetDry } from "../stores";

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
    <legend>Piano Volumes</legend>
    <div class="control">
      <span>Strings</span>
      <span>{$sampleVolumes.strings}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.strings}
        name="strings-volume"
      />
    </div>
    <div class="control">
      <span>Harmonics</span>
      <span>{$sampleVolumes.harmonics}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.harmonics}
        name="harmonics-volume"
      />
    </div>
    <div class="control">
      <span>Pedals</span>
      <span>{$sampleVolumes.pedal}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.pedal}
        name="pedals-volume"
      />
    </div>
    <div class="control">
      <span>Keybed</span>
      <span>{$sampleVolumes.keybed}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.keybed}
        name="keybed-volume"
      />
    </div>
  </fieldset>
  <fieldset>
    <legend>Audio Settings</legend>
    <div class="control">
      <span>Velocities</span>
      <span>{$sampleVelocities}</span>
      <RangeSlider
        min="1"
        max="4"
        step="1"
        bind:value={$sampleVelocities}
        name="sample-velocities"
      />
    </div>
    <div class="control">
      <span>Reverb</span>
      <span>{$reverbWetDry}</span>
      <RangeSlider
        min="0"
        max="1"
        step=".1"
        bind:value={$reverbWetDry}
        name="reverb-wetdry"
      />
    </div>
  </fieldset>
</div>

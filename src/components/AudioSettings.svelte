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
  import { pianoSettings } from "../stores";
  import RangeSlider from "../ui-components/RangeSlider.svelte";

  let sampleVelocitiesSliderValue;
  pianoSettings.subscribe(
    (val) => (sampleVelocitiesSliderValue = val.sampleVelocities),
  );
</script>

<div id="audio-panel">
  <fieldset>
    <legend>Piano Sample Volumes</legend>
    <div class="control">
      <span>Strings</span>
      <span>{$pianoSettings.sampleVolumes.strings}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$pianoSettings.sampleVolumes.strings}
        name="strings-volume"
      />
    </div>
    <div class="control">
      <span>Harmonics</span>
      <span>{$pianoSettings.sampleVolumes.harmonics}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$pianoSettings.sampleVolumes.harmonics}
        name="harmonics-volume"
      />
    </div>
    <div class="control">
      <span>Pedals</span>
      <span>{$pianoSettings.sampleVolumes.pedal}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$pianoSettings.sampleVolumes.pedal}
        name="pedals-volume"
      />
    </div>
    <div class="control">
      <span>Keybed</span>
      <span>{$pianoSettings.sampleVolumes.keybed}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$pianoSettings.sampleVolumes.keybed}
        name="keybed-volume"
      />
    </div>
  </fieldset>
  <fieldset>
    <legend>Audio Controls</legend>
    <div class="control">
      <span>Sample Count</span>
      <span>{sampleVelocitiesSliderValue}</span>
      <RangeSlider
        min="1"
        max="16"
        step="1"
        on:change={({ target: { value } }) =>
          ($pianoSettings.sampleVelocities = value)}
        bind:value={sampleVelocitiesSliderValue}
        name="sample-velocities"
      />
    </div>
    <div class="control">
      <span>Reverb</span>
      <span>{$pianoSettings.reverbWetDry}</span>
      <RangeSlider
        min="0"
        max="1"
        step=".05"
        bind:value={$pianoSettings.reverbWetDry}
        name="reverb-wetdry"
      />
    </div>
  </fieldset>
</div>

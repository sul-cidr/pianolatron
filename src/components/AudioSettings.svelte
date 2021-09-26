<script>
  import { sampleVolumes, sampleVelocities, reverbWetDry } from "../stores";
  import RangeSlider from "../ui-components/RangeSlider.svelte";

  let sampleVelocitiesSliderValue;
  let reverbWetDrySliderValue;

  $: sampleVelocitiesSliderValue = $sampleVelocities;
  $: reverbWetDrySliderValue = $reverbWetDry;
</script>

<div id="audio-panel">
  <fieldset>
    <legend>Piano Sample Volumes</legend>
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
    <legend>Audio Controls</legend>
    <div class="control">
      <span>Sample Count</span>
      <span>{sampleVelocitiesSliderValue}</span>
      <RangeSlider
        min="1"
        max="16"
        step="1"
        on:change={({ target: { value } }) => ($sampleVelocities = value)}
        bind:value={sampleVelocitiesSliderValue}
        mousewheel={false}
        name="sample-velocities"
      />
    </div>
    <div class="control">
      <span>Reverb</span>
      <span>{reverbWetDrySliderValue}</span>
      <RangeSlider
        min="0"
        max="1"
        step=".05"
        on:change={({ target: { value } }) => ($reverbWetDry = value)}
        bind:value={reverbWetDrySliderValue}
        mousewheel={false}
        name="reverb-wetdry"
      />
    </div>
  </fieldset>
</div>

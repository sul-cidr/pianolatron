<script>
  import { sampleVolumes, sampleVelocities, reverbWetDry } from "../stores";
  import SliderControl from "../ui-components/SliderControl.svelte";

  let sampleVelocitiesSliderValue;
  let reverbWetDrySliderValue;

  $: sampleVelocitiesSliderValue = $sampleVelocities;
  $: reverbWetDrySliderValue = $reverbWetDry;
</script>

<div id="audio-panel">
  <fieldset>
    <legend>Piano Sample Volumes</legend>
    {#each Object.keys($sampleVolumes) as sampleType}
      <SliderControl
        bind:value={$sampleVolumes[sampleType]}
        min="-60"
        max="10"
        step="1"
        name={`${sampleType}-volume`}
      >
        <span slot="label" style="text-transform: capitalize;"
          >{sampleType}</span
        >
      </SliderControl>
    {/each}
  </fieldset>
  <fieldset>
    <legend>Audio Controls</legend>
    <SliderControl
      bind:value={sampleVelocitiesSliderValue}
      min="1"
      max="16"
      step="1"
      name="sample-velocities"
      mousewheel={false}
      on:change={({ target: { value } }) => ($sampleVelocities = value)}
    >
      <span slot="label">Sample Count</span>
    </SliderControl>
    <SliderControl
      bind:value={reverbWetDrySliderValue}
      min="0"
      max="1"
      step=".05"
      name="reverb-wetdry"
      mousewheel={false}
      on:change={({ target: { value } }) => ($reverbWetDry = value)}
    >
      <span slot="label">Reverb</span>
    </SliderControl>
  </fieldset>
</div>

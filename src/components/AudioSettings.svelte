<script>
  import {
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
  } from "../stores";
  import SliderControl from "../ui-components/SliderControl.svelte";
  import VelocitySpliner from "./VelocitySpliner.svelte";

  let sampleVelocitiesSliderValue;
  let reverbWetDrySliderValue;

  const accentColor = getComputedStyle(
    document.documentElement,
  ).getPropertyValue("--primary-accent");

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
      <svelte:fragment slot="label">Sample Count</svelte:fragment>
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
      <svelte:fragment slot="label">Reverb</svelte:fragment>
    </SliderControl>
  </fieldset>
  <VelocitySpliner keyboardRegion={velocityCurveLow} {accentColor} />
  <VelocitySpliner keyboardRegion={velocityCurveMid} {accentColor} />
  <VelocitySpliner keyboardRegion={velocityCurveHigh} {accentColor} />
</div>

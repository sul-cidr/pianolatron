<style lang="scss">
  button {
    @include button;
  }
</style>

<script>
  import {
    sampleVolumes,
    sampleVelocities,
    softPedalRatio,
    accentBump,
    sustainProlong,
    reverbWetDry,
    velocityMods,
  } from "../stores";
  import { notify } from "../ui-components/Notification.svelte";
  import SliderControl from "../ui-components/SliderControl.svelte";
  import { getNoteName } from "../lib/hole-data";

  let sampleVelocitiesSliderValue;
  let reverbWetDrySliderValue;
  let softPedalSliderValue;
  let accentBumpSliderValue; // the pianola's foot pump is basically a pedal
  let sustainProlongSliderValue;

  $: sampleVelocitiesSliderValue = $sampleVelocities;
  $: reverbWetDrySliderValue = $reverbWetDry;
  $: softPedalSliderValue = $softPedalRatio;
  $: accentBumpSliderValue = $accentBump;
  $: sustainProlongSliderValue = $sustainProlong;
</script>

<div id="audio-panel">
  <fieldset>
    <legend>Sample Gain (dBFS)</legend>
    {#each Object.keys($sampleVolumes) as sampleType}
      <SliderControl
        bind:value={$sampleVolumes[sampleType]}
        min="-60"
        max="10"
        step="1"
        name={`${sampleType}-volume`}
        mousewheel={false}
      >
        <span slot="label" style="text-transform: capitalize;"
          >{sampleType}:</span
        >
      </SliderControl>
    {/each}
  </fieldset>
  <fieldset>
    <legend>Pedal Settings</legend>
    <SliderControl
      bind:value={softPedalSliderValue}
      min="0"
      max="1"
      step=".01"
      name="soft-pedal-ratio"
      mousewheel={false}
      on:change={({ target: { value } }) => ($softPedalRatio = value)}
    >
      <svelte:fragment slot="label">Soft Pedal Ratio:</svelte:fragment>
    </SliderControl>
    <SliderControl
      bind:value={accentBumpSliderValue}
      min="1"
      max="2"
      step=".05"
      name="accent-bump"
      mousewheel={false}
      on:change={({ target: { value } }) => ($accentBump = value)}
    >
      <svelte:fragment slot="label">Accent Modifier:</svelte:fragment>
    </SliderControl>
    <SliderControl
      bind:value={sustainProlongSliderValue}
      min="0"
      max="500"
      step="1"
      name="sustain-prolong"
      mousewheel={false}
      on:change={({ target: { value } }) => ($sustainProlong = value)}
    >
      <svelte:fragment slot="label">Sustain Release (+ms):</svelte:fragment>
    </SliderControl>
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
      <svelte:fragment slot="label">Sample Count:</svelte:fragment>
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
      <svelte:fragment slot="label">Reverb:</svelte:fragment>
    </SliderControl>
  </fieldset>
  <button
    on:click={() => {
      sampleVolumes.reset();
      sampleVelocities.reset();
      softPedalRatio.reset();
      accentBump.reset();
      sustainProlong.reset();
      reverbWetDry.reset();
      velocityMods.reset();
      notify({
        message: "Audio Settings have been reset!",
        type: "success",
        timeout: 4000,
      });
    }}>Reset Audio Settings</button
  >
  {#each Object.values($velocityMods) as keyboardRegion}
    <fieldset>
      <legend
        >{getNoteName(keyboardRegion.firstMidi)}-{getNoteName(
          keyboardRegion.lastMidi,
        )} Velocity Mods</legend
      >
      {#each Object.entries(keyboardRegion.mods) as [dynamic, modValue]}
        <SliderControl
          bind:value={modValue}
          min="0"
          max="2"
          step=".1"
          name="{keyboardRegion}-{dynamic}"
          mousewheel={false}
          on:change={({ target: { value } }) =>
            (keyboardRegion.mods[dynamic] = value)}
        >
          <svelte:fragment slot="label">{dynamic}</svelte:fragment>
        </SliderControl>
      {/each}
    </fieldset>
  {/each}
</div>

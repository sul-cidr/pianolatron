<style lang="scss">
  .splineCell {
    width: 100%;
  }
</style>

<script>
  import { CanvasSpliner } from "CanvasSpliner";
  import { onMount } from "svelte";
  import { getNoteName } from "../lib/utils";
  import {
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocityCurves,
  } from "../stores";
  import SliderControl from "../ui-components/SliderControl.svelte";

  let sampleVelocitiesSliderValue;
  let reverbWetDrySliderValue;

  const splineCurves = new Array($velocityCurves.keyboardRegions.length);
  const splineContainers = new Array($velocityCurves.keyboardRegions.length);
  const initSplines = (indexToReset) => {
    $velocityCurves.keyboardRegions.forEach((keyboardRegion, c) => {
      if (indexToReset !== undefined && indexToReset !== c) return;
      while (splineContainers[c].firstChild)
        splineContainers[c].removeChild(splineContainers[c].firstChild);
      const cs = new CanvasSpliner(
        splineContainers[c],
        splineContainers[c].clientWidth,
        splineContainers[c].clientWidth,
        "monotonic",
      );
      if (keyboardRegion.velocityPoints) {
        keyboardRegion.velocityPoints._points.forEach((point) => {
          cs.add({
            x: point.x / keyboardRegion.velocityPoints._max.x,
            y: point.y / keyboardRegion.velocityPoints._max.y,
          });
        });
      } else {
        cs.add({ x: 0, y: 0 });
        cs.add({ x: 0.5, y: 0.5 });
        cs.add({ x: 1, y: 1 });
      }
      cs.setControlPointRadius(5);
      cs.setControlPointColor("idle", "#8c1515");
      cs.setControlPointColor("hovered", "#8c1515");
      cs.setControlPointColor("grabbed", "#8c1515");
      cs.setCurveColor("idle", "#8c1515");
      cs.setCurveColor("moving", "#000000");
      cs.setCurveThickness(0.5);
      cs.setGridColor("#dad7cb");
      cs.setGridStep(0.1);
      cs.setTextColor("#8c1515");
      cs.setBackgroundColor("#FFFFFF");
      cs.draw();
      const getVelocityCurve = (spliner) => {
        const yCoords = spliner.getYSeriesInterpolated();
        const combinedCoords = [];
        spliner.getXSeriesInterpolated().forEach((xCoord, i) => {
          combinedCoords.push([xCoord, yCoords[i]]);
        });
        return combinedCoords;
      };
      splineCurves[c] = cs;
      $velocityCurves.keyboardRegions[c].velocityCurve = getVelocityCurve(cs);
      $velocityCurves.keyboardRegions[c].velocityPoints = cs._pointCollection;
      ["movePoint", "releasePoint", "pointAdded", "pointRemoved"].forEach(
        (eventType) => {
          cs.on(eventType, () => {
            $velocityCurves.keyboardRegions[c].velocityCurve =
              getVelocityCurve(cs);
            $velocityCurves.keyboardRegions[c].velocityPoints =
              cs._pointCollection;
          });
        },
      );
    });
  };
  onMount(() => initSplines());

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
  {#each $velocityCurves.keyboardRegions as keyboardRegion, i}
    <fieldset>
      <legend
        >{getNoteName(keyboardRegion.firstMidi)}-{getNoteName(
          keyboardRegion.lastMidi,
        )} Velocity Curve</legend
      >
      <div bind:this={splineContainers[i]} class="splineCell" />
      <div>X axis = input, Y axis = output</div>
      <button
        type="button"
        on:click={() => {
          $velocityCurves.keyboardRegions[i].velocityPoints = null;
          initSplines(i);
        }}>Reset</button
      >
    </fieldset>
  {/each}
</div>

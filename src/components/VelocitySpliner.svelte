<style>
  .spliner-container {
    height: 200px;
  }
</style>

<script>
  import { onMount } from "svelte";
  import { CanvasSpliner } from "CanvasSpliner";
  import { getNoteName } from "../lib/utils";

  export let keyboardRegion;
  export let accentColor;

  let splinerContainer;
  let canvasSpliner;

  const getVelocityCurve = () => {
    const yCoords = canvasSpliner.getYSeriesInterpolated();
    return [...canvasSpliner.getXSeriesInterpolated()].map((xCoord, i) => [
      xCoord,
      yCoords[i],
    ]);
  };

  const onCurveUpdated = () => {
    $keyboardRegion.velocityCurve = getVelocityCurve();
    $keyboardRegion.velocityPoints = canvasSpliner._pointCollection;
  };

  const initSpline = () => {
    while (splinerContainer.firstChild)
      splinerContainer.removeChild(splinerContainer.firstChild);
    if (!accentColor)
      accentColor =
        getComputedStyle(splinerContainer).getPropertyValue("color");

    canvasSpliner = new CanvasSpliner(
      splinerContainer,
      splinerContainer.clientWidth,
      splinerContainer.clientHeight,
      "monotonic",
    );
    if ($keyboardRegion.velocityPoints) {
      $keyboardRegion.velocityPoints._points.forEach((point) => {
        canvasSpliner.add({
          x: point.x / $keyboardRegion.velocityPoints._max.x,
          y: point.y / $keyboardRegion.velocityPoints._max.y,
        });
      });
    } else {
      canvasSpliner.add({ x: 0, y: 0 });
      canvasSpliner.add({ x: 0.5, y: 0.5 });
      canvasSpliner.add({ x: 1, y: 1 });
    }
    canvasSpliner.setControlPointRadius(5);
    canvasSpliner.setControlPointColor("idle", accentColor);
    canvasSpliner.setControlPointColor("hovered", accentColor);
    canvasSpliner.setControlPointColor("grabbed", accentColor);
    canvasSpliner.setCurveColor("idle", accentColor);
    canvasSpliner.setCurveColor("moving", "#000000");
    canvasSpliner.setCurveThickness(0.5);
    canvasSpliner.setGridColor("#dad7cb");
    canvasSpliner.setGridStep(0.1);
    canvasSpliner.setTextColor(accentColor);
    canvasSpliner.setBackgroundColor("#FFFFFF");
    canvasSpliner.draw();

    ["movePoint", "releasePoint", "pointAdded", "pointRemoved"].forEach(
      (eventType) => canvasSpliner.on(eventType, onCurveUpdated),
    );

    return () => (canvasSpliner = null);
  };

  onMount(initSpline);
</script>

<fieldset>
  <legend
    >{getNoteName($keyboardRegion.firstMidi)}-{getNoteName(
      $keyboardRegion.lastMidi,
    )} Velocity Curve</legend
  >
  <div bind:this={splinerContainer} class="spliner-container" />
  <div>X axis = input, Y axis = output</div>
  <button
    type="button"
    on:click={() => {
      keyboardRegion.reset();
      initSpline();
    }}>Reset</button
  >
</fieldset>

<style>
  .splineCell {
    height: 200px;
  }
</style>

<script>
  import { onMount } from "svelte";
  import { CanvasSpliner } from "CanvasSpliner";
  import { getNoteName } from "../lib/utils";

  export let keyboardRegion;

  let container;

  const initSpline = () => {
    while (container.firstChild) container.removeChild(container.firstChild);
    const cs = new CanvasSpliner(
      container,
      container.clientWidth,
      container.clientHeight,
      "monotonic",
    );
    if ($keyboardRegion.velocityPoints) {
      $keyboardRegion.velocityPoints._points.forEach((point) => {
        cs.add({
          x: point.x / $keyboardRegion.velocityPoints._max.x,
          y: point.y / $keyboardRegion.velocityPoints._max.y,
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
    $keyboardRegion.velocityCurve = getVelocityCurve(cs);
    $keyboardRegion.velocityPoints = cs._pointCollection;
    ["movePoint", "releasePoint", "pointAdded", "pointRemoved"].forEach(
      (eventType) => {
        cs.on(eventType, () => {
          $keyboardRegion.velocityCurve = getVelocityCurve(cs);
          $keyboardRegion.velocityPoints = cs._pointCollection;
        });
      },
    );
  };

  onMount(initSpline);
</script>

<fieldset>
  <legend
    >{getNoteName($keyboardRegion.firstMidi)}-{getNoteName(
      $keyboardRegion.lastMidi,
    )} Velocity Curve</legend
  >
  <div bind:this={container} class="splineCell" />
  <div>X axis = input, Y axis = output</div>
  <button
    type="button"
    on:click={() => {
      $keyboardRegion.velocityPoints = null;
      initSpline();
    }}>Reset</button
  >
</fieldset>

<style lang="scss">
  .wrapper {
    position: relative;
  }

  .spliner-container {
    height: 200px;
    width: 100%;
  }

  .x-axis,
  .y-axis {
    position: absolute;
    color: rgba(black, 0.5);
  }

  .x-axis {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .y-axis {
    left: 0;
    top: 50%;
    transform: rotate(270deg) translateX(-50%);
    transform-origin: top left;
  }

  button {
    background: none;
    border: none;
    bottom: 4px;
    cursor: pointer;
    display: flex;
    margin: 0;
    padding: 0;
    position: absolute;
    right: 4px;

    :global(svg) {
      stroke: grey;
    }

    &:not([disabled]):hover :global(svg) {
      stroke: black;
    }

    &[disabled] {
      cursor: default;
      opacity: 0.5;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { CanvasSpliner } from "CanvasSpliner";
  import Icon from "../ui-components/Icon.svelte";
  import { tooltip } from "../lib/tooltip-action";
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

    canvasSpliner.setControlPointRadius(7);
    canvasSpliner.setCurveColor("moving", "#000000");
    canvasSpliner.setCurveThickness(0.5);
    canvasSpliner.setGridColor("#dad7cb");
    canvasSpliner.setGridStep(0.1);
    canvasSpliner.setBackgroundColor("#FFFFFF");

    if (accentColor) {
      canvasSpliner.setControlPointColor("idle", accentColor);
      canvasSpliner.setControlPointColor("hovered", accentColor);
      canvasSpliner.setControlPointColor("grabbed", accentColor);
      canvasSpliner.setCurveColor("idle", accentColor);
      canvasSpliner.setTextColor(accentColor);
    }

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
  <div class="wrapper">
    <div bind:this={splinerContainer} class="spliner-container" />
    {#if $keyboardRegion.velocityPoints}
      <button
        transition:fade
        use:tooltip={"Reset"}
        on:click={() => {
          keyboardRegion.reset();
          initSpline();
        }}><Icon name="reset" height="24" width="24" /></button
      >
    {/if}
    <span class="x-axis">input velocity</span>
    <span class="y-axis">output velocity</span>
  </div>
</fieldset>

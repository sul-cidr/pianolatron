<style lang="scss">
  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

    &::before {
      background: $primary-accent;
      content: "";
      display: block;
      height: 1px;
      pointer-events: none;
      position: absolute;
      top: 50%;
      width: 100%;
      z-index: 3;
    }

    &::after {
      background-color: $background-color;
      bottom: 0;
      content: " ";
      left: 0;
      mix-blend-mode: multiply;
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
    }

    :global(canvas) {
      background: white !important;
    }
    :global(.openseadragon-canvas:focus) {
      outline: none;
    }

    :global(mark) {
      background-color: yellow;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import OpenSeadragon from "openseadragon";
  import { rollMetadata, currentTick } from "../stores";

  export let imageUrl;
  export let holesByPx;

  let openSeadragon;
  let firstHolePx;
  let dragging;
  let paintedHoles = [];

  const panViewportToTick = (tick) => {
    if (!openSeadragon) return;
    const { viewport } = openSeadragon;
    // if we're dragging we want the target bounds, if otherwise (and most
    //   especially if we happen to be zooming) we want the current bounds
    const viewportBounds = viewport.getBounds(!dragging);
    const linePx = firstHolePx + (scrollDownwards ? tick : -tick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);
    const lineCenter = new OpenSeadragon.Point(
      viewportBounds.x + viewportBounds.width / 2,
      lineViewport.y,
    );

    viewport.panTo(lineCenter);
  };

  const highlightHoles = (tick) => {
    if (!openSeadragon) return;

    const holes = holesByPx.search(tick, tick);

    paintedHoles.forEach((elem) => {
      openSeadragon.viewport.viewer.removeOverlay(elem);
    });

    paintedHoles = [];

    holes.forEach((hole) => {
      const holeId = `${hole.TRACKER_HOLE}.${hole.ORIGIN_ROW}`;

      if (holeId in Object.keys(paintedHoles)) {
        return;
      }

      const markWidth = hole.WIDTH_COL;
      const markStartX = hole.ORIGIN_COL;
      const markStartY = hole.ORIGIN_ROW;
      const markEndY = hole.OFF_TIME;
      const markHeight = markEndY - markStartY;
      const midiNumber = hole.TRACKER_HOLE;

      const mark = document.createElement("mark");

      mark.dataset.midiNumber = midiNumber;

      const viewportRectangle = openSeadragon.viewport.imageToViewportRectangle(
        markStartX,
        markStartY,
        markWidth,
        markHeight,
      );
      openSeadragon.viewport.viewer.addOverlay(mark, viewportRectangle);

      paintedHoles[holeId] = mark;
    });
  };

  onMount(async () => {
    openSeadragon = OpenSeadragon({
      id: "roll-viewer",
      showNavigationControl: false,
      panHorizontal: true,
      visibilityRatio: 1,
      defaultZoomLevel: 1,
      minZoomLevel: 0.01,
      maxZoomLevel: 4,
      constrainDuringPan: true,
    });

    openSeadragon.addOnceHandler("update-viewport", () => panViewportToTick(0));
    openSeadragon.addHandler("canvas-drag", () => (dragging = true));
    openSeadragon.addHandler("canvas-drag-end", () => (dragging = false));
    openSeadragon.open(imageUrl);
  });

  $: panViewportToTick($currentTick);
  $: highlightHoles($currentTick);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
  $: firstHolePx = scrollDownwards
    ? parseInt($rollMetadata.FIRST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.FIRST_HOLE, 10);
</script>

<div id="roll-viewer" />

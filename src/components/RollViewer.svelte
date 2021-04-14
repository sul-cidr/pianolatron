<style lang="scss">
  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

    &::after {
      background: red;
      content: "";
      display: block;
      height: 1px;
      pointer-events: none;
      position: absolute;
      top: 50%;
      width: 100%;
    }

    :global(.openseadragon-canvas:focus) {
      outline: none;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import OpenSeadragon from "openseadragon";

  import { rollMetadata, currentTick } from "../stores";

  export let imageUrl;
  let openSeadragon;
  let dragging;

  const panViewportToTick = (tick) => {
    if (!openSeadragon) return;
    const { viewport } = openSeadragon;
    // if we're dragging we want the target bounds, if otherwise (and most
    //   especially if we happen to be zooming) we want the current bounds
    const viewportBounds = viewport.getBounds(!dragging);

    const linePx =
      parseInt($rollMetadata.FIRST_HOLE, 10) + (scrollDownwards ? tick : -tick);

    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    const lineCenter = new OpenSeadragon.Point(
      viewportBounds.x + viewportBounds.width / 2,
      lineViewport.y,
    );

    viewport.panTo(lineCenter);
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

    openSeadragon.addOnceHandler("update-viewport", () => {
      panViewportToTick(0);
    });

    openSeadragon.addHandler("canvas-drag", () => {
      dragging = true;
    });

    openSeadragon.addHandler("canvas-drag-end", () => {
      dragging = false;
    });

    openSeadragon.open(imageUrl);
  });

  $: panViewportToTick($currentTick);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
</script>

<div id="roll-viewer" />

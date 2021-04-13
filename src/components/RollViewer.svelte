<style lang="scss">
  #roll-viewer {
    position: relative;
    height: 200px;
    width: 100%;

    &::after {
      background: red;
      content: "";
      display: block;
      height: 1px;
      position: absolute;
      top: 50%;
      width: 100%;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import OpenSeadragon from "openseadragon";

  import { rollMetadata, currentTick } from "../stores";

  export let imageUrl;
  let openSeadragon;

  const panViewportToTick = (tick) => {
    if (!openSeadragon) return;
    const { viewport } = openSeadragon;
    const viewportBounds = viewport.getBounds();
    const linePx =
      parseInt($rollMetadata.FIRST_HOLE, 10) + (scrollDownwards ? tick : -tick);

    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    const lineCenter = new OpenSeadragon.Point(
      viewportBounds.width / 2,
      lineViewport.y,
    );

    viewport.panTo(lineCenter);
  };

  onMount(async () => {
    openSeadragon = OpenSeadragon({
      id: "roll-viewer",
      showNavigationControl: false,
      panHorizontal: false,
      visibilityRatio: 1,
      defaultZoomLevel: 1,
      minZoomLevel: 0.01,
      maxZoomLevel: 4,
    });

    openSeadragon.addOnceHandler("update-viewport", () => {
      panViewportToTick(0);
    });

    openSeadragon.open(imageUrl);
  });

  $: panViewportToTick($currentTick);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
</script>

<div id="roll-viewer" />

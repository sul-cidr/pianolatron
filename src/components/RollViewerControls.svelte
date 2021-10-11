<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import OpenSeadragon from "openseadragon";

  import IconButton from "../ui-components/IconButton.svelte";
  import { easingInterval } from "../lib/utils";

  export let openSeadragon;
  export let maxZoomLevel;
  export let minZoomLevel;
  export let updateTickByViewportIncrement;
  let actionInterval;

  const { viewport } = openSeadragon;
  let currentZoom = viewport.getZoom();

  const centerRoll = () => {
    const viewportBounds = viewport.getBounds();
    const lineCenter = new OpenSeadragon.Point(
      0.5,
      viewportBounds.y + viewportBounds.height / 2,
    );
    viewport.panTo(lineCenter);
  };

  const onZoom = () => (currentZoom = viewport.getZoom());

  const mousedownRepeatAction = (fn, immediate = true) => {
    actionInterval?.clear();
    if (immediate) fn();
    actionInterval = easingInterval(fn);
  };

  onMount(() => {
    openSeadragon.addHandler("zoom", onZoom);
    return () => {
      openSeadragon.removeHandler("zoom", onZoom);
      actionInterval?.clear();
    };
  });
</script>

<div class="overlay-buttons top-center" transition:fade>
  <IconButton
    class="overlay"
    disabled={currentZoom >= maxZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.min(viewport.getZoom() * 1.1, maxZoomLevel)),
    )}
    iconName="plus"
    height="24"
    width="24"
  />
  <IconButton
    class="overlay"
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.max(viewport.getZoom() * 0.9, minZoomLevel)),
    )}
    iconName="minus"
    height="24"
    width="24"
  />
  <IconButton
    class="overlay"
    disabled={currentZoom === 1}
    on:click={() => {
      viewport.zoomTo(1);
      centerRoll();
    }}
    iconName="fit-width"
    height="24"
    width="24"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
    iconName="arrow-up"
    height="24"
    width="24"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
    iconName="arrow-down"
    height="24"
    width="24"
  />
</div>
<svelte:window on:mouseup={() => actionInterval?.clear()} />

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import OpenSeadragon from "openseadragon";

  import Icon from "../ui-components/Icon.svelte";
  import { easingInterval } from "../utils";

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
  <button
    disabled={currentZoom >= maxZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.min(viewport.getZoom() * 1.1, maxZoomLevel)),
    )}
  >
    <Icon name="plus" height="24" width="24" />
  </button>
  <button
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.max(viewport.getZoom() * 0.9, minZoomLevel)),
    )}
  >
    <Icon name="minus" height="24" width="24" />
  </button>
  <button
    disabled={currentZoom === 1}
    on:click={() => {
      viewport.zoomTo(1);
      centerRoll();
    }}
  >
    <Icon name="fit-width" height="24" width="24" />
  </button>
  <button
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
  >
    <Icon name="arrow-up" height="24" width="24" />
  </button>
  <button
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
  >
    <Icon name="arrow-down" height="24" width="24" />
  </button>
</div>
<svelte:window on:mouseup={() => actionInterval?.clear()} />

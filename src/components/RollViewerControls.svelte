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
  export let panHorizontal;

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
    label="Zoom In"
    height="24"
    width="24"
    alt="Zoom In"
  />
  <IconButton
    class="overlay"
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.max(viewport.getZoom() * 0.9, minZoomLevel)),
    )}
    iconName="minus"
    label="Zoom Out"
    height="24"
    width="24"
    alt="Zoom Out"
  />
  <IconButton
    class="overlay"
    disabled={currentZoom === 1}
    on:click={() => {
      viewport.zoomTo(1);
      centerRoll();
    }}
    iconName="fit-width"
    label="Zoom to Roll Width"
    height="24"
    width="24"
    alt="Zoom to Roll Width"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
    iconName="arrow-up"
    label="Pan Up"
    height="24"
    width="24"
    alt="Pan Up"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
    iconName="arrow-down"
    label="Pan Down"
    height="24"
    width="24"
    alt="Pan Down"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() => panHorizontal(/* left = */ true))}
    iconName="arrow-left"
    label="Pan Left"
    height="24"
    width="24"
    alt="Pan Left"
  />
  <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      panHorizontal(/* left = */ false),
    )}
    iconName="arrow-right"
    label="Pan Right"
    height="24"
    width="24"
    alt="Pan Right"
  />
</div>
<svelte:window on:mouseup={() => actionInterval?.clear()} />

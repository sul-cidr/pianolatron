<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import OpenSeadragon from "openseadragon";

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
  <button
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={mousedownRepeatAction(() =>
      viewport.zoomTo(Math.max(viewport.getZoom() * 0.9, minZoomLevel)),
    )}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
  <button
    disabled={currentZoom === 1}
    on:click={() => {
      viewport.zoomTo(1);
      centerRoll();
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="7 8 3 12 7 16" />
      <polyline points="17 8 21 12 17 16" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="14" y1="12" x2="20" y2="12" />
    </svg>
  </button>
  <button
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="16" y1="9" x2="12" y2="5" />
      <line x1="8" y1="9" x2="12" y2="5" />
    </svg>
  </button>
  <button
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="16" y1="15" x2="12" y2="19" />
      <line x1="8" y1="15" x2="12" y2="19" />
    </svg>
  </button>
</div>
<svelte:window on:mouseup={() => actionInterval?.clear()} />

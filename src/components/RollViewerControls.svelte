<style lang="scss">
  .overlay-buttons {
    :global(button) {
      color: white;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  import IconButton from "../ui-components/IconButton.svelte";
  import { easingInterval } from "../lib/utils";

  export let openSeadragon;
  export let maxZoomLevel;
  export let minZoomLevel;
  export let updateTickByViewportIncrement;
  export let panHorizontal;
  export let adjustZoom;

  let actionInterval;

  const { viewport } = openSeadragon;
  let currentZoom = viewport.getZoom();

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
    class={"panzoom-button"}
    disabled={currentZoom >= maxZoomLevel}
    on:mousedown={mousedownRepeatAction(() => adjustZoom("zoomIn"))}
    iconName="plus"
    label="Zoom In"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={mousedownRepeatAction(() => adjustZoom("zoomOut"))}
    iconName="minus"
    label="Zoom Out"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={currentZoom === 1}
    on:click={() => {
      adjustZoom("resetZoom");
    }}
    iconName="fit-width"
    label="Zoom to Roll Width"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
    iconName="arrow-up"
    label="Pan Up"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
    iconName="arrow-down"
    label="Pan Down"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:mousedown={mousedownRepeatAction(() => panHorizontal(/* left = */ true))}
    iconName="arrow-left"
    label="Pan Left"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:mousedown={mousedownRepeatAction(() =>
      panHorizontal(/* left = */ false),
    )}
    iconName="arrow-right"
    label="Pan Right"
    height="24"
    width="24"
  />
</div>
<svelte:window on:mouseup={() => actionInterval?.clear()} />

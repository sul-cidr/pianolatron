<style lang="scss">
  .overlay-buttons {
    opacity: 0;
    transition: opacity 0.3s ease;

    &:hover,
    &:focus-within {
      opacity: 1;
    }

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
  let viewport;
  let currentZoom;

  const onZoom = () => (currentZoom = viewport.getZoom());

  const repeatAction = (fn, immediate = true) => {
    actionInterval?.clear();
    if (immediate) fn();
    actionInterval = easingInterval(fn);
  };

  const keyboardInvokeAction = (keydownEvent, fn) => {
    if (keydownEvent.key === " " || keydownEvent.key === "Enter") {
      keydownEvent.preventDefault();
      keydownEvent.stopPropagation();
      if (keydownEvent.repeat) return;
      repeatAction(fn);
    }
  };

  onMount(() => {
    if (!openSeadragon) return;
    ({ viewport } = openSeadragon);
    currentZoom = viewport.getZoom();

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
    on:mousedown={repeatAction(() => adjustZoom("zoomIn"))}
    on:keydown={(e) => keyboardInvokeAction(e, () => adjustZoom("zoomIn"))}
    iconName="plus"
    label="Zoom In"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={currentZoom <= minZoomLevel}
    on:mousedown={repeatAction(() => adjustZoom("zoomOut"))}
    on:keydown={(e) => keyboardInvokeAction(e, () => adjustZoom("zoomOut"))}
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
    on:mousedown={repeatAction(() =>
      updateTickByViewportIncrement(/* up = */ true),
    )}
    on:keydown={(e) =>
      keyboardInvokeAction(e, () =>
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
    on:mousedown={repeatAction(() =>
      updateTickByViewportIncrement(/* up = */ false),
    )}
    on:keydown={(e) =>
      keyboardInvokeAction(e, () =>
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
    on:mousedown={repeatAction(() => panHorizontal(/* left = */ true))}
    on:keydown={(e) =>
      keyboardInvokeAction(e, () => panHorizontal(/* left = */ true))}
    iconName="arrow-left"
    label="Pan Left"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:mousedown={repeatAction(() => panHorizontal(/* left = */ false))}
    on:keydown={(e) =>
      keyboardInvokeAction(e, () => panHorizontal(/* left = */ false))}
    iconName="arrow-right"
    label="Pan Right"
    height="24"
    width="24"
  />
  <IconButton
    class={"panzoom-button"}
    disabled={false}
    on:click={() => {
      viewport.viewer.setFullScreen(!viewport.viewer.isFullScreen());
    }}
    iconName="full-screen"
    label="Full Screen"
    height="24"
    width="24"
  />
</div>
<svelte:window
  on:mouseup={() => actionInterval?.clear()}
  on:keyup={(e) => {
    if (e.key === " " || e.key === "Enter") actionInterval?.clear();
  }}
/>

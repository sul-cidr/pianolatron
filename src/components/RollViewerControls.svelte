<style lang="scss">
  #roll-viewer-controls {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    left: 50%;
    padding: 8px;
    position: absolute;
    top: 8px;
    transform: translateX(-50%);
    z-index: 25;

    button {
      background: none;
      border: none;
      color: #ffffff;
      cursor: pointer;
      margin: 0;
      padding: 0.35em 0.8em;
      transition: all 0.2s;

      &:focus,
      &:active {
        outline: 0;
      }

      &:hover {
        outline: 1px solid white;
      }

      &:active {
        color: grey;
      }

      &:disabled {
        color: grey;
      }
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import OpenSeadragon from "openseadragon";

  export let openSeadragon;
  export let maxZoomLevel;
  export let minZoomLevel;

  let currentZoom = openSeadragon.viewport.getZoom();

  const centerRoll = () => {
    const { viewport } = openSeadragon;
    const viewportBounds = viewport.getBounds();
    const lineCenter = new OpenSeadragon.Point(
      0.5,
      viewportBounds.y + viewportBounds.height / 2,
    );
    viewport.panTo(lineCenter);
  };

  const onZoom = () => (currentZoom = openSeadragon.viewport.getZoom());

  onMount(() => {
    openSeadragon.addHandler("zoom", onZoom);
    return () => openSeadragon.removeHandler("zoom", onZoom);
  });
</script>

<div id="roll-viewer-controls">
  <button
    disabled={currentZoom >= maxZoomLevel}
    on:click={() => openSeadragon.viewport.zoomTo(Math.min(openSeadragon.viewport.getZoom() * 1.1, maxZoomLevel))}
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
    on:click={() => openSeadragon.viewport.zoomTo(Math.max(openSeadragon.viewport.getZoom() * 0.9, minZoomLevel))}
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
      openSeadragon.viewport.zoomTo(1);
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
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  </button>
</div>

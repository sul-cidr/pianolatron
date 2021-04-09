<style>
  #roll-viewer {
    width: 100%;
    height: 200px;
  }
</style>

<script>
  import { onMount } from "svelte";
  import OpenSeadragon from "openseadragon";

  export let imageUrl;

  onMount(async () => {
    const openSeadragon = OpenSeadragon({
      id: "roll-viewer",
      showNavigationControl: false,
      panHorizontal: false,
      visibilityRatio: 1,
      defaultZoomLevel: 1,
      minZoomLevel: 0.01,
      maxZoomLevel: 4,
    });

    openSeadragon.open(imageUrl);
  });
</script>

<div id="roll-viewer" />

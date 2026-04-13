<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>

<script>
  import { tick } from "svelte";

  export let announcement;
  let announcer;

  const announce = async (announcement) => {
    if (announcer === undefined) return;
    announcer.textContent = "";
    await tick();
    announcer.textContent = announcement;
  };

  $: announce(announcement);
</script>

<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
  bind:this={announcer}
></div>

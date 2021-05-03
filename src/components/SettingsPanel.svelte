<style lang="scss">
  div {
    background: var(--background-color);
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
</style>

<script>
  import { fly } from "svelte/transition";

  let el;
</script>

<div
  bind:this={el}
  transition:fly={{ delay: 0, duration: 300, x: parseInt(window.getComputedStyle(el).width, 10), y: 0, opacity: 1 }}
>
  <p>settings panel</p>
</div>

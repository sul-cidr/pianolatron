<style lang="scss">
  div#settings-panel {
    background: var(--background-color);
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  button {
    height: 1.5em;
    width: 1.5em;
    border-radius: 1.5em;
    border: none;
    margin: 0 0.5em;

    &.active {
      outline: 1px solid var(--primary-accent);
      outline-offset: 4px;
    }

    &.cardinal {
      background: $cardinal;
    }
    &.blue {
      background: steelblue;
    }
    &.green {
      background: darkolivegreen;
    }
  }
</style>

<script>
  import { fly } from "svelte/transition";

  let el;
  let currentColor = document.body.className || "cardinal";

  const colors = ["cardinal", "blue", "green"];
</script>

<div
  id="settings-panel"
  bind:this={el}
  transition:fly={{ delay: 0, duration: 300, x: parseInt(window.getComputedStyle(el).width, 10), y: 0, opacity: 1 }}
>
  <div>
    Theme:
    {#each colors as color}
      <button
        class={color}
        class:active={currentColor === color}
        on:click={() => {
          currentColor = color;
          document.body.className = color;
        }}
      />
    {/each}
  </div>
</div>

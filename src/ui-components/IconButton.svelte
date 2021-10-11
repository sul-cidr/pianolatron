<style lang="scss">
  button {
    background: none;
    border: none;
    cursor: pointer;
    margin: 0;
    padding: 0;

    :global(svg) {
      stroke: grey;
    }

    &:not([disabled]):hover :global(svg) {
      stroke: black;
    }

    &[disabled] {
      cursor: default;
      opacity: 0.5;
    }
  }
</style>

<script>
  import Icon from "./Icon.svelte";
  import { tooltip as tooltipAction } from "../lib/tooltip-action";

  export let height = 20;
  export let width = 20;

  export let tooltip;
  export let disabled = false;

  export let iconName;

  export let ref = undefined;
</script>

<button use:tooltipAction={tooltip} {disabled} on:click bind:this={ref}>
  <Icon name={iconName} {height} {width} />
</button>

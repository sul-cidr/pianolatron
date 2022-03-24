<style lang="scss">
  button {
    background: none;
    border: none;
    color: grey;
    cursor: pointer;
    margin: 0;
    padding: 0;
    transition: all 0.2s;

    &:not(:disabled):hover {
      color: black;
    }

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }

    &.overlay {
      color: #ffffff;
      padding: 0.35em 0.8em;

      &:focus,
      &:active {
        outline: 0;
      }

      &:hover {
        color: white;
        outline: 1px solid white;
      }

      &:active {
        color: grey;
      }

      &:disabled {
        color: grey;
        cursor: not-allowed;
      }
    }
  }
</style>

<script>
  import Icon from "./Icon.svelte";
  import { tooltip as tooltipAction } from "../lib/tooltip-action";

  export let height = 20;
  export let width = 20;

  export let tooltip = undefined;
  export let disabled = false;

  export let iconName;
  export let label;

  export let ref = undefined;
</script>

<button
  class={$$props.class}
  aria-label={label}
  use:tooltipAction={tooltip}
  {disabled}
  on:click
  on:mousedown
  bind:this={ref}
>
  <Icon name={iconName} {height} {width} aria-hidden="true" focusable="false" />
  <slot />
</button>

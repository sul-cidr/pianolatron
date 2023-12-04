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

    &.player-button {
      filter: drop-shadow(2px 2px 1px #a4a4a4);
      padding: 0.35em 0.8em;

      &:active {
        color: white;
        filter: drop-shadow(1px 1px 1px #a4a4a4);
      }

      &:focus,
      &:active {
        outline: 0;
      }

      &:hover,
      &.enabled,
      &.pause {
        color: white;
      }

      &:disabled {
        color: grey;
        cursor: not-allowed;
      }

      &.pause-record {
        color: red;
        &:active {
          color: white;
        }
      }

      &.record:active,
      &.record:hover,
      &.record:focus {
        color: red;
      }
    }
    &.performer-button {
      align-items: center;
      color: var(--white);
      display: flex;
      justify-content: center;
      padding: 0.5rem;
      width: 100%;

      &:active {
        color: var(--white);
      }

      &:focus,
      &:active {
        outline: 0;
      }

      &:hover,
      &.enabled,
      &.pause {
        color: var(--white);
      }

      &:disabled {
        color: var(--cool-grey);
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
  title={label}
>
  <Icon name={iconName} {height} {width} aria-hidden="true" focusable="false" />
  <slot />
</button>

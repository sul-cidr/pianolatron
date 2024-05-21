<style lang="scss">
  button {
    background: none;
    border: none;
    color: grey;
    cursor: pointer;
    margin: 0;
    padding: 0.35em 0.8em;
    transition: all 0.2s;

    &:not(:disabled):hover {
      color: white;
    }

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }

    &.player-button {
      display: inline-block;
      border: 2px solid rgba(black, 0.6);
      border-radius: 0.25em;
      transition: all 0.2s;
      padding: 0.4em 0.8em 0.3em;
      cursor: pointer;
      filter: drop-shadow(2px 2px 1px #a4a4a4);
      color: rgba(black, 0.6);

      &:hover {
        background-color: unset;
        color: unset;
        border: 2px solid rgba(white, 1);
      }

      &:active {
        color: white;
        filter: drop-shadow(1px 1px 1px #a4a4a4);
      }

      &:focus,
      &:active {
        outline: 0;
      }

      &:hover,
      &.enabled {
        color: white;
      }

      &:disabled {
        color: grey;
        cursor: not-allowed;
      }

      &.pause-record {
        @keyframes recordCycle {
          0% {
            color: red;
          }

          50% {
            color: white;
          }

          100% {
            color: red;
          }
        }
        &:active {
          color: white;
        }
        animation: recordCycle ease;
        animation-iteration-count: infinite;
        animation-duration: 2s;
        animation-fill-mode: both;
      }

      &.continue-record {
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
      &.enabled {
        color: var(--white);
      }

      &:disabled {
        cursor: not-allowed;
      }
    }
    &.always-visible {
      color: var(--black-30);

      &:hover,
      &.enabled {
        color: var(--white);
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

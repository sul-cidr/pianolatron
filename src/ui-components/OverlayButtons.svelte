<style lang="scss">
  div {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    padding: 8px;
    position: absolute;
    z-index: z($main-context, overlay-buttons);

    :global(button) {
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
        cursor: not-allowed;
      }
    }

    &.top-center {
      left: 50%;
      top: 8px;
      transform: translateX(-50%);
    }

    &.top-left {
      left: 1em;
      top: 0;
      transform: translateY(-100%);
      border-radius: 4px 4px 0 0;
      padding: 0;
      opacity: 0;
      transition: all 0.3s ease;
    }

    &.middle-right {
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;

      :global(button) {
        padding: 0.8em 0.35em;
      }
    }
  }
</style>

<script>
  import { fade } from "svelte/transition";

  export let position;
</script>

<div class={`overlay-buttons ${position}`} transition:fade>
  <slot />
</div>

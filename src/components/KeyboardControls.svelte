<style lang="scss">
  div {
    left: 1em;
    top: 0;
    transform: translateY(-100%);
    border-radius: 4px 4px 0 0;
    padding: 0;
    opacity: 0;
    transition: all 0.3s ease;

    &:hover {
      opacity: 1;
    }

    &.outside {
      bottom: 0;
      left: 0;
      top: unset;
      opacity: 1;
      //transform: translateX(-50%);
      border-radius: 0 4px 4px 0;
    }
  }

  button {
    border-radius: 4px 4px 0 0;
  }
</style>

<script>
  import { fade } from "svelte/transition";
  import Icon from "../ui-components/Icon.svelte";
  import { userSettings } from "../stores";

  export let outside = false;
</script>

<div class="overlay-buttons" class:outside transition:fade|local>
  <button
    on:click={() => ($userSettings.showKeyboard = !$userSettings.showKeyboard)}
  >
    <Icon
      name={$userSettings.showKeyboard ? "piano-down" : "piano-up"}
      height="24"
      width="24"
    />
  </button>
  {#if !outside}
    <button
      on:click={() =>
        ($userSettings.overlayKeyboard = !$userSettings.overlayKeyboard)}
    >
      <Icon
        name={$userSettings.overlayKeyboard ? "piano-out" : "piano-in"}
        height="24"
        width="24"
      />
    </button>
  {/if}
</div>

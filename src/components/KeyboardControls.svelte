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
  import { showKeyboard, overlayKeyboard } from "../stores";

  export let outside;
</script>

<div class="overlay-buttons" class:outside transition:fade>
  <button on:click={() => ($showKeyboard = !$showKeyboard)}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <rect x="2" y="3" width="20" height="12" rx="2" />
      <line
        x1="7"
        y1="5"
        x2="7"
        y2="9.5"
        id="line18"
        style="stroke-width:2.5;stroke-linecap:square"
      />
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="9.5"
        style="stroke-width:2.5;stroke-linecap:square"
      />
      <line
        x1="17"
        y1="5"
        x2="17"
        y2="9.5"
        style="stroke-width:2.5;stroke-linecap:square"
      />
      {#if $showKeyboard}
        <path d="m 10,19.000041 2,2 2,-2" />
      {:else}
        <path d="M10 21l2 -2l2 2" />
      {/if}
    </svg>
  </button>
  {#if !outside}
    <button on:click={() => ($overlayKeyboard = !$overlayKeyboard)}>
      {#if $overlayKeyboard}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 19h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4"
          />
          <rect x="14" y="14" width="7" height="5" rx="1" />
          <line x1="7" y1="9" x2="11" y2="13" />
          <path d="M8 13h3v-3" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 19h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4"
          />
          <rect x="14" y="14" width="7" height="5" rx="1" />
          <line x1="7" y1="9" x2="11" y2="13" />
          <path d="M7 12v-3h3" />
        </svg>
      {/if}
    </button>
  {/if}
</div>

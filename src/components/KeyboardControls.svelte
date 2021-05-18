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
  }

  button {
    border-radius: 4px 4px 0 0;
  }
</style>

<script>
  import { fade } from "svelte/transition";
  import { overlayKeyboard } from "../stores";
</script>

<div class="overlay-buttons" transition:fade>
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
</div>

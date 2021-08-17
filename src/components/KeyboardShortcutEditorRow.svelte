<style lang="scss">
  dd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    svg {
      cursor: pointer;
      stroke: grey;

      &:hover {
        stroke: black;
      }
    }
  }
</style>

<script>
  export let shortcut;
  let editing = false;
</script>

<dt>{shortcut.description}</dt>
<dd>
  {#if editing}
    <span>Choose a new keystroke...</span>
  {:else}
    <kbd>{shortcut.key}</kbd>
  {/if}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke-width="2"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    on:click={() => (editing = !editing)}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
    <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
    <line x1="16" y1="5" x2="19" y2="8" />
  </svg>
</dd>

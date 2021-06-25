<style lang="scss">
  div {
    text-align: right;
  }
  input {
    display: none;
  }

  label {
    display: inline-block;
    padding: 0.2em 0.2em 0;
    border: 2px solid rgba(black, 0.4);
    border-radius: 0.25em;
    transition: all 0.2s;
    opacity: 0.4;
    cursor: pointer;

    &:hover {
      background-color: unset;
      color: unset;
    }
  }

  input:checked + label {
    color: white;
    background-color: var(--primary-accent);
    cursor: unset;
    opacity: 1;
  }
</style>

<script>
  const panels = ["controls", "settings"];
  export let selectedPanel;
</script>

<div>
  {#each panels as panel}
    <input
      type="radio"
      name="panel-switcher"
      bind:group={selectedPanel}
      value={panel}
      id={panel}
    />
    <label for={panel}>
      {#if panel === "controls"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="14" cy="6" r="2" />
          <line x1="4" y1="6" x2="12" y2="6" />
          <line x1="16" y1="6" x2="20" y2="6" />
          <circle cx="8" cy="12" r="2" />
          <line x1="4" y1="12" x2="6" y2="12" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <circle cx="17" cy="18" r="2" />
          <line x1="4" y1="18" x2="15" y2="18" />
          <line x1="19" y1="18" x2="20" y2="18" />
        </svg>
      {:else if panel === "settings"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      {/if}
    </label>
  {/each}
</div>

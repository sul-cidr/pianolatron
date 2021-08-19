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
  import Icon from "../ui-components/Icon.svelte";

  const panels = ["controls", "settings", "audio"];
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
        <Icon name="sliders" height="24" width="24" />
      {:else if panel === "settings"}
        <Icon name="cog" height="24" width="24" />
      {:else if panel === "audio"}
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
          <rect x="2" y="7" width="20" height="12" rx="2" />
          <line
            x1="7"
            y1="9"
            x2="7"
            y2="13.5"
            style="stroke-width:2.5;stroke-linecap:square"
          />
          <line
            x1="12"
            y1="9"
            x2="12"
            y2="13.5"
            style="stroke-width:2.5;stroke-linecap:square"
          />
          <line
            x1="17"
            y1="9"
            x2="17"
            y2="13.5"
            style="stroke-width:2.5;stroke-linecap:square"
          />
        </svg>
      {/if}
    </label>
  {/each}
</div>

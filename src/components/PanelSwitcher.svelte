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

  const panels = [
    ["controls", "sliders"],
    ["settings", "cog"],
    ["audio", "piano"],
  ];
  export let selectedPanel;
</script>

<div>
  {#each panels as [panel, icon]}
    <input
      type="radio"
      name="panel-switcher"
      bind:group={selectedPanel}
      value={panel}
      id={panel}
    />
    <label for={panel}>
      <Icon name={icon} height="24" width="24" />
    </label>
  {/each}
</div>

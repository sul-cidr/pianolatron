<style lang="scss">
  div {
    text-align: right;
    user-select: none;
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

  export let panels;
  export let selectedPanel;
</script>

<div class={$$props.class}>
  {#each Object.entries(panels) as [panel, label]}
    <input
      type="radio"
      name={Math.random().toString(16).slice(2)}
      bind:group={selectedPanel}
      value={panel}
      id={panel}
    />
    <label for={panel}>
      {#if label.icon}
        <Icon name={label.icon} height="24" width="24" alt={label.alt} />
      {/if}
      {#if label.text}
        {label.text}
      {/if}
    </label>
  {/each}
</div>

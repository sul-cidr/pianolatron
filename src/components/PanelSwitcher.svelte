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
    cursor: pointer;
  }

  input:checked + label {
    background-color: var(--primary-accent);
    cursor: default;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding-bottom: 2px;

    &:focus {
      outline-offset: 0;
    }
  }
</style>

<script>
  import IconButton from "../ui-components/IconButton.svelte";

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
    <label for={panel} aria-label={label.title} title={label.title}>
      {#if label.icon}
        <IconButton
          class={selectedPanel === panel
            ? "selected-menu-button"
            : "menu-button"}
          disabled={false}
          on:click={() => {
            selectedPanel = panel;
          }}
          iconName={label.icon}
          label={label.title}
          tooltip={label.title}
          height="32"
          width="32"
        />
      {/if}
      {#if label.text}
        <button
          class={selectedPanel === panel ? "selected-menu-button" : ""}
          on:click={() => {
            selectedPanel = panel;
          }}
          label={label.title}
          tooltip={label.title}>{label.text}</button
        >
      {/if}
    </label>
  {/each}
</div>

<style lang="scss">
  dt {
    display: flex;
    align-items: center;
  }

  dd {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 0.2em 0;

    span {
      color: grey;
    }
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    margin: 0;
    padding: 0;

    :global(svg) {
      stroke: grey;
    }

    &:not([disabled]):hover :global(svg) {
      stroke: black;
    }

    &[disabled] {
      cursor: default;
      opacity: 0.5;
    }
  }
</style>

<script>
  import { createEventDispatcher } from "svelte";
  import Icon from "../ui-components/Icon.svelte";

  export let shortcut;
  export let meta;
  let editButtonRef;

  const dispatch = createEventDispatcher();
  const updateShortcut = (event) => dispatch("update", event);
  const toggleEditing = () => dispatch("toggleEditing");
  const resetShortcut = () => dispatch("reset");
</script>

<dt data-tooltip={meta.help}>{meta.description}</dt>
<dd>
  {#if shortcut.editing}
    <span>Choose a new keystroke...</span>
  {:else}
    <kbd>{shortcut.key}</kbd>
  {/if}
  <button
    data-tooltip="Edit"
    bind:this={editButtonRef}
    on:click={toggleEditing}
  >
    <Icon name="edit" height="20" width="20" />
  </button>
  <button
    data-tooltip={shortcut.isChanged ? "Reset to Default" : undefined}
    disabled={!shortcut.isChanged}
    on:click={resetShortcut}
  >
    <Icon name="reset" height="20" width="20" />
  </button>
</dd>

<svelte:window
  on:keydown|preventDefault|capture={(event) =>
    shortcut.editing && event.stopPropagation()}
  on:keyup|preventDefault|capture={(event) => {
    if (!shortcut.editing) return;
    if (event.code !== "Escape") updateShortcut(event);
    shortcut.editing = false;
    editButtonRef.blur();
    event.stopPropagation();
  }}
/>

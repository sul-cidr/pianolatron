<style lang="scss">
  dd {
    justify-content: flex-end;

    span {
      color: grey;
    }
  }
</style>

<script>
  import { createEventDispatcher } from "svelte";
  import IconButton from "../ui-components/IconButton.svelte";
  import { tooltip } from "../lib/tooltip-action";

  export let shortcut;
  export let meta;
  let editing = false;
  let editButtonRef;

  const dispatch = createEventDispatcher();
  const updateShortcut = (event) => dispatch("update", event);
  const resetShortcut = () => dispatch("reset");
</script>

<dt use:tooltip={meta.help}>{meta.description}:</dt>
<dd>
  {#if editing}
    <span>Choose a new keystroke...</span>
  {:else}
    <kbd>{shortcut.key}</kbd>
  {/if}
  <IconButton
    iconName="edit"
    label="Edit Keystroke"
    height="20"
    width="20"
    tooltip="Edit"
    on:click={() => (editing = !editing)}
    bind:ref={editButtonRef}
  />
  {#key shortcut.isChanged}
    <IconButton
      iconName="reset"
      label="Reset Keystroke to Default"
      height="20"
      width="20"
      tooltip={shortcut.isChanged ? "Reset to Default" : undefined}
      disabled={!shortcut.isChanged}
      on:click={resetShortcut}
    />
  {/key}
</dd>

<svelte:window
  on:keydown|preventDefault|capture={(event) =>
    editing && event.stopPropagation()}
  on:keyup|preventDefault|capture={(event) => {
    if (!editing) return;
    updateShortcut(event);
    editing = false;
    editButtonRef.blur();
    event.stopPropagation();
  }}
/>

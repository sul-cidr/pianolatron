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
  import { getShortcutKeyDesc } from "../config/keyboard-shortcut-config";

  export let shortcut;
  export let meta;
  let editing = false;
  let editButtonRef;

  const defaultKey = shortcut.key;
  let shortcutKey = getShortcutKeyDesc(shortcut.key);

  const dispatch = createEventDispatcher();
  const updateShortcut = (event) => {
    shortcutKey = getShortcutKeyDesc(event.key);
    dispatch("update", event);
  };
  const resetShortcut = () => {
    shortcutKey = getShortcutKeyDesc(defaultKey);
    dispatch("reset");
  };
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
    label="Press button and type a key to change keystroke for {meta.description}, currently {shortcutKey}"
    height="20"
    width="20"
    tooltip="Edit"
    on:click={() => (editing = !editing)}
    bind:ref={editButtonRef}
  />
  {#key shortcut.isChanged}
    <IconButton
      iconName="reset"
      label="Reset Keystroke to Default for {meta.description}, currently {shortcutKey}"
      height="20"
      width="20"
      tooltip={shortcut.isChanged ? "Reset to Default" : undefined}
      disabled={!shortcut.isChanged}
      on:click={resetShortcut}
    />
  {/key}
</dd>

<svelte:window
  on:keydown|capture={(event) => {
    editing && event.preventDefault() && event.stopPropagation();
  }}
  on:keyup|capture={(event) => {
    if (!editing) return;
    event.preventDefault();
    updateShortcut(event);
    editing = false;
    editButtonRef.blur();
    event.stopPropagation();
  }}
/>

<style lang="scss">
  div {
    background-color: var(--background-color);
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    left: 50%;
    max-height: 80%;
    max-width: 100%;
    min-width: 400px;
    padding: 1em;
    position: absolute;
    top: 42%;
    transform: translate(-50%, -50%);
    width: 400px;
    z-index: z($main-context, notifications);
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    font-size: 1.4em;
    font-weight: bold;
    justify-content: space-between;
    margin-bottom: 0.5em;
    text-decoration: underline;
  }

  p {
    margin-bottom: 1em;
  }

  p.error-message {
    border-radius: 5px;
    border: 1px solid red;
    color: red;
    padding: 0.25em;
  }

  dl {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
    gap: 0 0.25em;
    overflow-y: auto;
    overflow-x: hidden;
  }

  p.reset {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 1em 0;
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

    &:hover :global(svg) {
      stroke: black;
    }
  }
</style>

<script>
  import { fade, slide } from "svelte/transition";
  import KeyboardShortcutEditorRow from "./KeyboardShortcutEditorRow.svelte";
  import Icon from "../ui-components/Icon.svelte";
  import {
    defaultKeyMap,
    keyMapMeta,
    unusableKeys,
    alternativeIndicatorText,
  } from "../config/keyboard-shortcut-config";
  import { keyMap, toggleKeybindingsConfig } from "./KeyboardShortcuts.svelte";

  let errorMessage;

  const updateKeyBinding = (shortcut, detail) => {
    errorMessage = undefined;

    if (
      Object.values($keyMap)
        .map(({ code }) => code)
        .includes(detail.code) &&
      detail.code !== $keyMap[shortcut].code
    ) {
      errorMessage = `The "${detail.key}" key is already assigned.`;
      return;
    }

    if (unusableKeys.includes(detail.code)) {
      errorMessage = `The "${detail.key}" key cannot be assigned.`;
      return;
    }

    $keyMap[shortcut].code = detail.code;
    $keyMap[shortcut].key = alternativeIndicatorText[detail.code] || detail.key;

    $keyMap[shortcut].isChanged = detail.key !== defaultKeyMap[shortcut].key;
  };

  const resetShortcuts = () => {
    errorMessage = undefined;
    $keyMap = JSON.parse(JSON.stringify(defaultKeyMap));
  };
</script>

<div transition:fade>
  <header>
    Keyboard Controls
    <button on:click={toggleKeybindingsConfig}>
      <Icon name="cross" height="24" width="24" />
    </button>
  </header>
  <p>Click the edit button to reassign a control button.</p>
  {#if errorMessage}
    <p class="error-message" transition:slide>{errorMessage}</p>
  {/if}
  <dl>
    {#each Object.keys($keyMap) as shortcut}
      <KeyboardShortcutEditorRow
        shortcut={$keyMap[shortcut]}
        meta={keyMapMeta[shortcut]}
        on:update={({ detail }) => updateKeyBinding(shortcut, detail)}
        on:reset={() => updateKeyBinding(shortcut, defaultKeyMap[shortcut])}
      />
    {/each}
  </dl>
  {#if Object.values($keyMap).some((shortcut) => shortcut.isChanged)}
    <p class="reset" transition:slide>
      Reset to defaults: <button on:click={resetShortcuts}>
        <Icon name="reset" height="24" width="24" />
      </button>
    </p>
  {/if}
</div>

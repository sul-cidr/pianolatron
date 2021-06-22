<style lang="scss">
  .filtered-select {
    height: 2.25em;
    position: relative;
    width: 100%;

    &::after {
      border: 3px solid var(--primary-accent);
      border-right: 0;
      border-top: 0;
      border-radius: 2px;
      content: " ";
      display: block;
      height: 0.625em;
      margin-top: -0.4375em;
      pointer-events: none;
      position: absolute;
      right: 1.125em;
      top: 50%;
      transform: rotate(-45deg);
      transform-origin: center;
      width: 0.625em;
      z-index: 4;
    }
  }

  input {
    cursor: pointer;
    font: inherit;
    height: 100%;
    padding: 5px 2.5em 5px 11px;
    width: 100%;
  }

  ul {
    background: #fff;
    border: 1px solid #999;
    display: none;
    margin: 0;
    max-height: calc(15 * (1rem + 10px) + 15px);
    min-width: 100%;
    overflow-y: auto;
    padding: 10px 0;
    position: relative;
    top: 0px;
    user-select: none;
    width: max-content;
    z-index: 99;

    &.open {
      display: block;
    }
  }

  li {
    color: #333;
    cursor: pointer;
    line-height: 1;
    padding: 5px 15px;
    white-space: nowrap;
    width: 100%;

    &.selected {
      background-color: var(--primary-accent);
      color: #fff;
    }
  }
</style>

<script>
  import { clamp } from "../utils";

  export let items = [];
  export let selectedItem;

  export let labelFieldName;
  export let searchFieldName = labelFieldName;

  let text;
  let listItems = [];
  let filteredListItems;

  let open = false;
  let activeListItemIndex = -1;

  let input;
  let list;

  const selectListItem = (
    listItem = filteredListItems[activeListItemIndex],
  ) => {
    selectedItem = listItem.item;
    open = false;
  };

  const activateListItem = (index) => {
    activeListItemIndex = clamp(index, 0, filteredListItems.length - 1);
    const el = list.querySelector(".selected");
    if (el) {
      if (typeof el.scrollIntoViewIfNeeded === "function") {
        el.scrollIntoViewIfNeeded();
      }
    }
  };

  const activateDropdown = () => {
    input.value = "";
    filteredListItems = listItems;
    open = true;
    activateListItem(items.indexOf(selectedItem));
  };

  const search = async () => {
    open = true;
    filteredListItems = listItems;
    activeListItemIndex = 0;

    if (!text) return;
    const filteredText = text
      .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ")
      .trim()
      .toLowerCase();

    if (filteredText) {
      const searchParts = filteredText.split(" ");

      filteredListItems = listItems
        .filter((listItem) =>
          searchParts.every((searchPart) =>
            listItem.searchContent.includes(searchPart),
          ),
        )
        .map((item) => {
          const newItem = { ...item };
          newItem.markedUp = item.label;
          searchParts.forEach((searchPart) => {
            newItem.markedUp = newItem.markedUp.replace(
              new RegExp(searchPart, "ig"),
              "<b>$&</b>",
            );
          });
          return newItem;
        });
    }
  };

  const prepareListItems = () => {
    listItems = items.map((item) => ({
      searchContent: (searchFieldName ? item[searchFieldName] : item)
        .toLowerCase()
        .trim(),
      label: labelFieldName ? item[labelFieldName] : item,
      item,
    }));
  };

  const onSelectedItemChanged = () => {
    text = labelFieldName ? selectedItem[labelFieldName] : selectedItem;
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: items, prepareListItems();
  $: open, onSelectedItemChanged();
</script>

<div class="filtered-select">
  <input
    type="text"
    bind:this={input}
    bind:value={text}
    on:input={search}
    on:focus={activateDropdown}
    on:click={activateDropdown}
    on:keydown|stopPropagation={({ key }) => {
      switch (key) {
        case 'ArrowDown':
          if (!open) activateDropdown();
          activateListItem(activeListItemIndex + 1);
          break;

        case 'ArrowUp':
          if (!open) activateDropdown();
          activateListItem(activeListItemIndex - 1);
          break;

        case 'PageDown':
          if (!open) activateDropdown();
          activateListItem(activeListItemIndex + 15);
          break;

        case 'PageUp':
          if (!open) activateDropdown();
          activateListItem(activeListItemIndex - 15);
          break;

        case 'Escape':
          if (open) open = false;
          break;

        case 'Enter':
          selectListItem();
          break;

        default:
      }
    }}
  />
  <ul class:open bind:this={list}>
    {#if filteredListItems?.length}
      {#each filteredListItems as listItem, i}
        <li
          class:selected={i === activeListItemIndex}
          on:click={() => selectListItem(listItem)}
          on:pointerenter={() => (activeListItemIndex = i)}
        >
          {@html listItem.markedUp || listItem.label}
        </li>
      {/each}
    {:else}
      <li>No results found</li>
    {/if}
  </ul>
</div>

<svelte:window
  on:click={({ target, defaultPrevented }) => {
    if (!(list.contains(target) || input.contains(target)) && !defaultPrevented) open = false;
  }}
/>

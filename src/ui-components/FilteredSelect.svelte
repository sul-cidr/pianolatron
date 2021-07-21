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
    }
  }

  span.input {
    background: white;
    cursor: pointer;
    display: inline-block;
    height: 100%;
    line-height: calc(2.25em - 10px);
    overflow: hidden;
    padding: 5px 2.5em 5px 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  div.dropdown {
    display: none;
    background: #fff;
    border: 1px solid #999;
    position: relative;
    width: max-content;
    z-index: z($main-context, roll-selector-dropdown);

    &.open {
      display: block;
    }
  }

  div.facets {
    text-align: right;
    padding: 5px 15px;
    display: flex;
    align-items: flex-end;
    gap: 15px;

    ul {
      flex: 1 0 auto;
      margin: 0;
      text-align: left;
      padding: 0;
    }

    li {
      display: inline-block;
      border-radius: 6px;
      background-color: grey; // var(--primary-accent);
      color: white;
      padding: 1px 8px;
      margin: 0 4px;
      cursor: pointer;

      &.active {
        background-color: var(--primary-accent);
      }
    }
  }

  ul.items {
    margin: 0;
    max-height: calc(15 * (1rem + 10px) + 15px);
    min-width: 100%;
    overflow-y: auto;
    padding: 10px 0;
    position: relative;
    top: 0px;
    user-select: none;
    z-index: 99;

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

        :global(mark) {
          color: #fff;
        }
      }

      :global(mark) {
        background-color: unset;
        color: green;
        font-weight: 700;
      }
    }
  }
</style>

<script>
  import { tick } from "svelte";
  import { clamp } from "../utils";

  export let items = [];
  export let selectedItem;

  export let labelFieldName;
  export let searchFieldName = labelFieldName;
  export let facetFieldName;

  export let postMarkup = (str) => str;

  let listItems = [];
  let filteredListItems;
  let facets;

  let open = false;
  let activeListItemIndex = -1;
  let activeFacet;

  let input;
  let dropdown;
  let list;

  const unDecomposableMap = {
    ł: "l",
    ß: "ss",
    æ: "ae",
    ø: "o",
  };

  const unDecomposableRegex = new RegExp(
    Object.keys(unDecomposableMap).join("|"),
    "g",
  );

  const longSubstitutionsRegex = new RegExp(
    Object.keys(unDecomposableMap)
      .filter((k) => unDecomposableMap[k].length > 1)
      .join("|"),
    "gi",
  );

  const normalizeText = (str) =>
    str
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(unDecomposableRegex, (m) => unDecomposableMap[m])
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const startIdxAdjustment = (str, idx) =>
    (str.toLowerCase().substring(0, idx).match(longSubstitutionsRegex) || [])
      .length;

  const endIdxAdjustment = (str, idx) =>
    (
      str.toLowerCase().substring(0, idx).match(longSubstitutionsRegex) || []
    ).reduce((adj, m) => adj + (unDecomposableMap[m].length - m.length), 0);

  const markupMatches = (label, searchContent, searchParts) => {
    const matchExtents = [];
    const mergedExtents = [];
    let markedUp = label;

    searchParts.forEach((searchPart) => {
      let idx = -1;
      while ((idx = searchContent.indexOf(searchPart, idx + 1)) > -1) {
        const _idx = idx - startIdxAdjustment(label, idx - 1);
        const _idxEnd =
          idx +
          searchPart.length -
          endIdxAdjustment(label, _idx + searchPart.length - 1);
        matchExtents.push([_idx, _idxEnd]);
      }
    });

    matchExtents
      .sort((a, b) => a[0] - b[0])
      .forEach(([start, end]) => {
        const previousExtent = mergedExtents[mergedExtents.length - 1];
        if (previousExtent && previousExtent[1] >= start) {
          previousExtent[1] = Math.max(previousExtent[1], end);
        } else {
          mergedExtents.push([start, end]);
        }
      });

    mergedExtents
      .sort((a, b) => b[0] - a[0])
      .forEach(([start, end]) => {
        markedUp = `${markedUp.substring(0, start)}<mark>${markedUp.substring(
          start,
          end,
        )}</mark>${markedUp.substring(end)}`;
      });
    return markedUp;
  };

  const activateListItem = async (index) => {
    activeListItemIndex = clamp(index, 0, filteredListItems.length - 1);

    await tick();

    const activeListItem = list.querySelector(".selected");

    if (activeListItem) {
      const {
        top: listItemTop,
        bottom: listItemBottom,
      } = activeListItem.getBoundingClientRect();
      const { top: listTop, bottom: listBottom } = list.getBoundingClientRect();

      if (listItemBottom > listBottom) activeListItem.scrollIntoView(false);
      if (listItemTop < listTop) activeListItem.scrollIntoView();
    }
  };

  const search = async () => {
    open = true;
    filteredListItems = listItems;
    activeListItemIndex = 0;

    filteredListItems = listItems;

    if (activeFacet)
      filteredListItems = listItems.filter(
        (listItem) => listItem.item[facetFieldName] === activeFacet,
      );

    if (!input.innerHTML) return;

    const filteredText = normalizeText(
      input.innerHTML.replace(/[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "),
    );

    if (filteredText) {
      const searchParts = filteredText.split(" ").slice(0, 8);

      filteredListItems = filteredListItems
        .filter((listItem) =>
          searchParts.every((searchPart) =>
            listItem.searchContent.includes(searchPart),
          ),
        )
        .map((item) => ({
          ...item,
          markedUp: markupMatches(item.label, item.searchContent, searchParts),
        }));
    }
  };

  const setActiveFacet = async (facet) => {
    activeFacet = facet === activeFacet ? undefined : facet;
    search();
  };

  const prepareListItems = () => {
    listItems = items.map((item) => ({
      searchContent: normalizeText(
        searchFieldName ? item[searchFieldName] : item,
      ),
      label: labelFieldName ? item[labelFieldName] : item,
      item,
    }));
    if (facetFieldName)
      facets = [...new Set(items.map((item) => item[facetFieldName]))];
  };

  const onSelectedItemChanged = () => {
    if (input)
      input.innerHTML = postMarkup(
        labelFieldName ? selectedItem[labelFieldName] : selectedItem,
      );
  };

  const activateDropdown = async () => {
    if (open) return;
    open = true;
    await tick();
    input.innerHTML = "";
    activeFacet = undefined;
    filteredListItems = listItems;
    activateListItem(items.indexOf(selectedItem));
    input.focus();
  };

  const closeDropdown = () => {
    open = false;
    onSelectedItemChanged();
    input.blur();
  };

  const toggleDropdown = () => (open ? closeDropdown() : activateDropdown());

  const selectListItem = (
    listItem = filteredListItems[activeListItemIndex],
  ) => {
    selectedItem = listItem.item;
    closeDropdown();
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: items, prepareListItems();
  $: selectedItem, onSelectedItemChanged();
</script>

<div class="filtered-select">
  <span
    class="input"
    spellcheck="false"
    contenteditable="true"
    bind:this={input}
    on:input={search}
    on:focus={activateDropdown}
    on:mousedown|preventDefault={toggleDropdown}
    on:keydown|stopPropagation={({ key }) => {
      switch (key) {
        case "ArrowDown":
          activateDropdown();
          activateListItem(activeListItemIndex + 1);
          break;

        case "ArrowUp":
          activateDropdown();
          activateListItem(activeListItemIndex - 1);
          break;

        case "PageDown":
          activateDropdown();
          activateListItem(activeListItemIndex + 15);
          break;

        case "PageUp":
          activateDropdown();
          activateListItem(activeListItemIndex - 15);
          break;

        case "Escape":
          closeDropdown();
          break;

        case "Enter":
          selectListItem();
          closeDropdown();
          break;

        default:
      }
    }}
  />
  <div class="dropdown" class:open bind:this={dropdown}>
    <div class="facets">
      {#if facets}
        <ul>
          {#each facets as facet}
            <li
              class:active={facet === activeFacet}
              on:click={() => {
                setActiveFacet(facet);
                input.focus();
              }}
            >
              {facet}
            </li>
          {/each}
        </ul>
      {/if}
      Filtered: {filteredListItems?.length} / {listItems.length}
    </div>
    <ul class="items" class:open bind:this={list}>
      {#if filteredListItems?.length}
        {#each filteredListItems as listItem, i}
          <li
            class:selected={i === activeListItemIndex}
            on:click={() => selectListItem(listItem)}
            on:pointerenter={() => (activeListItemIndex = i)}
          >
            {@html postMarkup(listItem.markedUp || listItem.label)}
          </li>
        {/each}
      {:else}
        <li>No results found</li>
      {/if}
    </ul>
  </div>
</div>

<svelte:window
  on:click={({ target }) => {
    if (open && !(dropdown.contains(target) || input.contains(target))) {
      closeDropdown();
    }
  }}
  on:keydown|stopPropagation={({ key }) => {
    if (open && key === "Escape") closeDropdown();
  }}
/>

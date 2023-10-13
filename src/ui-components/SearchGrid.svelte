<style lang="scss">
  @import "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";

  .search-box {
    height: 2.25em;
    position: relative;
    width: 100%;

  }

  span.input {
    background: white;
    cursor: pointer;
    display: inline-block;
    height: 100%;
    line-height: calc(2.25em - 10px);
    overflow: hidden;
    padding: 5px 2.5em 5px 11px;
    margin: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 30%;
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

    }
  }
</style>

<script>
  import Grid from "gridjs-svelte"
  import { SvelteWrapper } from "gridjs-svelte/plugins";
  import { html } from "gridjs";


  export const items = [];
  export const selectedItem = undefined;

  export let itemFilter = () => {};

  // export let labelFieldName;
  export let facetFieldName;

  export let placeHolder = "Select an item...";

  export const postMarkup = (str) => str;

  export let activeFacet;
  export let setActiveFacet = (_) => {};
  
  export let listItems = [];
  export let facets = [];
  export let filteredListItems = [];

  export let input;
  let list;


  const search = async () => {
    return itemFilter();
  };

  const activateInput = () => {
    input.innerHTML = "";
    filteredListItems = activeFacet
      ? listItems.filter(
          (listItem) => listItem.item[facetFieldName] === activeFacet,
        )
      : listItems;
    input.focus();
  };


  /* eslint-disable no-unused-expressions, no-sequences */
  $: activeFacet, search(); 
  $: filteredListItems

  const getLinksForCell = (druid) => {
    return html(`
      <a href="/?druid=${druid}">Listen</a><br/>
      <a href="/perform/?druid=${druid}">Perform</a>
    `)
  }

  const columns = [
    {
      data: (r) => r.item.druid,
      name: "",
      formatter: (cell) => getLinksForCell(cell),
      sort: false
    },
    {
      data: (r) => r.item._label,
      name: "Label",
      sort: true
    },
    {
      data: (r) => r.item.druid,
      name: "Druid",
      sort: false
    },
  ];

  const pagination = {
		enabled: true,
		limit: 10
	};

</script>

<div class="search-box">
  <span
    role="textbox"
    tabindex="0"
    class="input"
    spellcheck="false"
    contenteditable="true"
    bind:this={input}
    on:focus={activateInput}
    on:input={search}>{@html placeHolder}
  </span>
  <div>
    <div class="facets">
      {#if facets}
        <ul>
          {#each facets as facet}
            <li class:active={facet === activeFacet}>
              <span
                role="checkbox"
                tabindex="0"
                aria-checked={facet === activeFacet}
                on:click={() => {
                  setActiveFacet(facet);
                  input.focus();
                }}
                on:keypress={(event) => {
                  if (event.code === "Enter") {
                    setActiveFacet(facet);
                    input.focus();
                  }
                }}
              >
                {facet}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
      Filtered: {filteredListItems?.length} / {listItems.length}
    </div>
    <Grid data={filteredListItems} {columns}  {pagination} />
  </div>
</div>
<style lang="scss">
  @import "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";


  .search-box {
    height: 2.25em;
    position: relative;
    width: 100%;
  

    &::after {
      border: 3px solid var(--primary-accent);
      border-right: 0;
      border-top: 0;
      border-radius: 2px;
      display: block;
      height: 0.625em;
      margin-top: -0.4375em;
      pointer-events: none;
      position: absolute;
      right: 1.125em;
      top: 50%;
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
</style>

<script>
  import { beforeUpdate, afterUpdate } from "svelte";
  import Grid from "gridjs-svelte";
  import { SvelteWrapper } from "gridjs-svelte/plugins";
  import { html } from "gridjs";
  import catalog from "../config/catalog.json";

  let grid = false;
  let input;

  let listItems;
  let filteredListItems;

  let activeFacet;
  let facets = [];

  const getLinksForCell = (druid) => {
    return html(`
        <a href="/?druid=${druid}">Listen</a><br/>
        <a href="/perform/?druid=${druid}">Perform</a>
        `);
  };

  const data = catalog.map((item) => [
    `${item.number} ${item.title} ${item.performer} [${item.publisher}]`,
    getLinksForCell(item.druid),
    item.work,
    item.composer,
    item.performer,
    item.type,
  ]);

  beforeUpdate(async () => {
    if (grid) {
      grid.instance.config.plugin.remove("pagination");
      grid.instance.config.plugin.remove("search");
    }
  });

  const columns = [
    {
      id: "_label",
      hidden: true,
    },
    {
      id: "links",
      name: "",
      sort: false,
    },
    {
      name: "Label",
      sort: true,
    },
    {
      name: "Composer",
      sort: true,
    },
    {
      name: "Performer",
      sort: true,
    },
    {
      name: "Type",
      sort: true,
    },
  ];

  const pagination = {
    enabled: true,
    limit: 10,
  };

  let placeHolder = "SEARCH";

  const search = async () => {
    await itemFilter();
  };

  const facetFilter = (listItem) => listItem[listItem.length - 1] === activeFacet;

  const activateInput = () => {
    input.innerHTML = "";
    filteredListItems = activeFacet
      ? listItems.filter(facetFilter)
      : listItems;
    input.focus();
  };

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

  const normalizeText = (str) =>
    str
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(unDecomposableRegex, (m) => unDecomposableMap[m])
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();


  const itemFilter = async () => {
    if (activeFacet) {
      filteredListItems = listItems.filter(facetFilter);
    } else {
      filteredListItems = listItems;
    }
    if (!input || !input.innerHTML || input.innerHTML == placeHolder ) return;
    const filteredText = normalizeText(
      input.innerHTML.replace(/<br>|[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "),
    );
    if (filteredText) {
      console.log(filteredText);
      const searchParts = filteredText.split(" ").slice(0, 8);
      filteredListItems = filteredListItems
        .filter((listItem) =>
          searchParts.every((searchPart) =>
            listItem[0].includes(searchPart),
          ),
        )
    }
  };

  const prepareListItems = () => {
    listItems = data.map((item) => {
      const [ _label, ...arr ] = item;
      return [ normalizeText(_label), ...arr];
    });
    facets = [...new Set(data.map((item) => item[ item.length - 1 ] ))];
  };

  const setActiveFacet = (facet) => {
    activeFacet = facet === activeFacet ? undefined : facet;
  };

  $: data, prepareListItems();
  $: activeFacet, search();
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
    on:input={search}
    >{@html placeHolder}
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
                }}
                on:keypress={(event) => {
                  if (event.code === "Enter") {
                    setActiveFacet(facet);
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
    <Grid data={filteredListItems} {columns} {pagination} bind:this={grid} />
  </div>
</div>

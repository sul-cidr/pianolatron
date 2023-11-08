<style lang="scss">
  @import "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";

  #app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;

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
  }
</style>

<script>
  import { beforeUpdate } from "svelte";
  import Grid from "gridjs-svelte";
  import { html } from "gridjs";
  import catalog from "../config/catalog.json";

  let grid = false;
  let input;

  let filteredListItems;
  let activeFacet;

  const searchFields = ["title", "composer", "performer", "publisher"];

  const getLinksForCell = (druid) => {
    return html(`
        <a href="/?druid=${druid}">Listen</a><br/>
        <a href="/perform/?druid=${druid}">Perform</a>
        `);
  };

  beforeUpdate(async () => {
    if (grid) {
      grid.instance.config.plugin.remove("pagination");
      grid.instance.config.plugin.remove("search");
    }
  });

  const columns = [
    {
      id: "_links",
      name: "",
      sort: false,
      data: (r) => r._d_links,
    },
    {
      name: "Title",
      sort: true,
      data: (r) => r._d_title,
    },
    {
      name: "Composer",
      sort: true,
      data: (r) => r._d_composer,
    },
    {
      name: "Performer",
      sort: true,
      data: (r) => r._d_performer,
    },
    {
      name: "Publisher",
      sort: true,
      data: (r) => r._d_publisher,
    },
  ];

  const style = {};

  const pagination = {
    enabled: true,
    limit: 10,
  };

  let placeHolder = "SEARCH";

  const facetFilter = (listItem) => listItem.type === activeFacet;

  const activateInput = () => {
    input.innerHTML = "";
    filteredListItems = activeFacet ? listItems.filter(facetFilter) : listItems;
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

  const itemFilter = async () => {
    if (activeFacet) {
      filteredListItems = listItems.filter(facetFilter);
    } else {
      filteredListItems = listItems;
    }

    if (!input || input.innerHTML == placeHolder) return;

    const filteredText = normalizeText(
      input.innerHTML.replace(/<br>|[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "),
    );

    if (filteredText) {
      const searchParts = filteredText.split(" ").slice(0, 8);
      filteredListItems = filteredListItems
        .filter((listItem) =>
          searchParts.every((searchPart) =>
            listItem._search.includes(searchPart),
          ),
        )
        .map((item) => {
          searchFields.forEach(
            (k) =>
              (item[`_d_${k}`] = markupMatches(
                item[k],
                item[`_s_${k}`],
                searchParts,
              )),
          );
          return item;
        });
    } else {
      // no search term so we need to be sure to remove any hit highlights that might still be present.
      filteredListItems = filteredListItems.map((item) => {
        searchFields.forEach((k) => (item[`_d_${k}`] = item[k]));
        return item;
      });
    }
  };

  const setActiveFacet = (facet) => {
    activeFacet = facet === activeFacet ? undefined : facet;
  };

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
    return html(markedUp);
  };

  const listItems = catalog.map((item) => {
    // _s_ prefix is for search ( normalizedText is called )
    // _d_ prefix is for display (they can be marked up)
    const listItem = {
      druid: item.druid,
      title: item.work,
      composer: item.composer,
      performer: item.performer,
      publisher: item.publisher,
      type: item.type,
      _d_links: getLinksForCell(item.druid),
    };
    const searchArr = [];
    searchFields.forEach((k) => {
      searchArr.push(item[k]);
      listItem[`_s_${k}`] = normalizeText(item[k]);
      listItem[`_d_${k}`] = item[k];
    });

    return { ...listItem, _search: normalizeText(searchArr.join("   ")) };
  });

  const facets = [...new Set(listItems.map((item) => item.type))];

  $: activeFacet, itemFilter();
</script>

<div id="app">
  <div class="search-box">
    <span
      role="textbox"
      tabindex="0"
      class="input"
      spellcheck="false"
      contenteditable="true"
      bind:this={input}
      on:focus={activateInput}
      on:input={itemFilter}
      >{@html placeHolder}
    </span>
  </div>
  <!-- search-box -->
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
  <!-- facets -->
  <Grid
    data={filteredListItems}
    {columns}
    {pagination}
    {style}
    bind:this={grid}
  />
</div>
<!-- app -->

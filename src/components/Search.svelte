<style lang="scss">
  @import "/public/styles/mermaid.min.css";

  #app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 10px;

    .search-box {
      height: 2.25em;
      position: relative;
      display: flex;
      width: 30%;
      margin: 5px;

      label {
        margin: auto 10px;
        font-weight: bold;
      }

      input {
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
    }

    div.facets {
      text-align: right;
      padding: 5px 15px;
      display: flex;
      align-items: flex-end;
      gap: 15px;

      label,
      .facet-heading {
        margin: auto;
        font-weight: bold;
      }

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

  :global(.row-links a) {
    color: var(--primary-accent);
    margin-left: 10px;
    margin-right: 10px;
    display: inline-block;
    height: 20px;
  }
</style>

<script>
  import Grid from "gridjs-svelte";
  import { html } from "gridjs";
  import catalog from "../config/catalog.json";

  let grid = null;
  let input;

  let filteredListItems;
  let activeFacet;

  const searchFields = ["title", "composer_arranger", "performer", "publisher"];

  // taken from Icon component
  // The way grid.js loads the values (and icons/links) for each row as HTML
  // makes it very difficult to reuse that component here.
  const icons = {
    piano: `
      <svg height="24" width="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" name="piano">
        <rect x="2" y="7" width="20" height="12" rx="2"></rect>
        <line x1="7" y1="9" x2="7" y2="13.5" style="stroke-width:2.5;stroke-linecap:square"></line>
        <line x1="12" y1="9" x2="12" y2="13.5" style="stroke-width:2.5;stroke-linecap:square"></line>
        <line x1="17" y1="9" x2="17" y2="13.5" style="stroke-width:2.5;stroke-linecap:square"></line>
      </svg>
      `,
    play: `
      <svg height="24" width="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" name="piano">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z"
          fill="currentColor"
        />
        <path d="M16 12L10 16.3301V7.66987L16 12Z" fill="currentColor" />
      </svg>
      `,
    midi: `
      <svg height="24" width="24" viewBox="0 0 712 266" stroke-width="2" stroke="currentColor" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" name="midi">
        <path aria-label="M" text-data="M" d="m 0,0 h 233 c 19.6,0 31,16.9 31,37 V 266 H 199 V 67 H 161 V 266 H 102 V 67 H 65 V 266 H 0 Z" />
        <rect aria-label="I" text-data="I" x="296" y="0" width="65" height="266" />
        <path aria-label="D" text-data="D" d="m 392,0 h 193 c 19.6,0 31,16.9 31,37 v 196 c 0,24.9 -10.4,33 -33,33 H 392 V 97 h 66 v 104 h 93 V 60 H 392 Z" />
        <rect aria-label="I" text-data="I" x="646" y="0" width="66" height="266" />
      </svg>
      `,
    roll_image: `
      <svg height="24" width="24" aria-label="Roll image" role="img" viewBox="0 0 300 550" stroke-width="2" stroke="currentColor" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" name="roll-image">
        <rect x="1" y="50" width="298" height="200" stroke-width="4"></rect>
        <path fill="lightgrey" stroke-width="4" d="M 1 250 V 400 L 135 549 H 165 L 299 400 V 250 Z"></path>
        <rect x="100" y="400" width="100" height="75" rx="5%" fill="white" stroke-width="2"></rect>
      </svg>
      `,
  };

  const getLinksForCell = (druid) => {
    const catalogEntry = catalog.filter((obj) =>
      Object.keys(obj).some((key) => obj[key].includes(druid)),
    )[0];
    const imageKey = catalogEntry.image_url.split("/").slice(-2, -1)[0];
    const imageLink = `https://stacks.stanford.edu/file/${druid}/${imageKey}.jp2`;

    return html(`
      <span class="row-links">
        <a href="/?druid=${druid}" title="Play roll">
          ${icons.play}
        </a>
        <a href="/perform/?druid=${druid}" title="Perform roll">
          ${icons.piano}
        </a>
        <a href="/midi/${druid}.mid" title="Download MIDI">
          ${icons.midi}
        </a>
        <a href="${imageLink}" title="Download image">
          ${icons.roll_image}
        </a>
      </span>
    `);
  };

  const pagination = {
    enabled: true,
    limit: 20,
  };

  const facetFilter = (listItem) => listItem.type === activeFacet;

  const activateInput = () => {
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

  const listItems = catalog.map((item) => {
    // _s_ prefix is for search ( normalizedText is called )
    // _d_ prefix is for display (they can be marked up)
    const listItem = {
      druid: item.druid,
      title: item.work,
      composer_arranger: [
        ...new Set([item.composer, item.arranger].filter(Boolean)),
      ].join(" <br/>"),
      performer: item.performer,
      publisher: `${item.publisher} (${item.number})`,
      type: item.type,
      _d_links: getLinksForCell(item.druid),
    };
    const searchArr = [];
    searchFields.forEach((k) => {
      searchArr.push(listItem[k]);
      listItem[`_s_${k}`] = normalizeText(listItem[k]);
      listItem[`_d_${k}`] = html(listItem[k]);
    });

    return { ...listItem, _search: normalizeText(searchArr.join("   ")) };
  });

  const sortColumnHtml = (a, b) => {
    if (a.props.content > b.props.content) {
      return 1;
    }
    if (b.props.content > a.props.content) {
      return -1;
    }
    return 0;
  };

  const columns = [
    {
      id: "_d_links",
      name: "Play/Perform/MIDI/Image",
      width: "240px",
      sort: false,
      data: (r) => r._d_links,
    },
    {
      id: "_d_title",
      name: "Title",
      sort: { compare: sortColumnHtml },
      data: (r) => r._d_title,
    },
    {
      id: "_d_composer_arranger",
      name: "Composer / Arranger",
      sort: { compare: sortColumnHtml },
      data: (r) => r._d_composer_arranger,
    },
    {
      id: "_d_performer",
      name: "Performer",
      sort: { compare: sortColumnHtml },
      data: (r) => r._d_performer,
    },
    {
      id: "_d_publisher",
      name: "Publisher",
      sort: { compare: sortColumnHtml },
      data: (r) => r._d_publisher,
    },
  ];

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

  const itemFilter = async () => {
    if (activeFacet) {
      filteredListItems = listItems.filter(facetFilter);
    } else {
      filteredListItems = listItems;
    }

    if (!input) return;
    const filteredText = normalizeText(
      input.value.replace(/<br>|[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "),
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
        searchFields.forEach((k) => (item[`_d_${k}`] = html(item[k])));
        return item;
      });
    }
  };

  const setActiveFacet = (facet) => {
    activeFacet = facet === activeFacet ? undefined : facet;
  };

  const facets = [...new Set(listItems.map((item) => item.type))];

  /* eslint-disable no-unused-expressions, no-sequences */
  $: activeFacet, itemFilter();
</script>

<div id="app">
  <div class="search-box">
    <label for="searchbox">SEARCH:</label>
    <input
      role="textbox"
      name="searchbox"
      tabindex="0"
      class="input"
      spellcheck="false"
      contenteditable="true"
      aria-multiline="false"
      bind:this={input}
      on:focus={activateInput}
      on:input={itemFilter}
    />
  </div>
  <!-- search-box -->
  <div class="facets">
    <div class="facet-heading">ROLL TYPE:</div>
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
    resizable={true}
    bind:this={grid}
  />
</div>
<!-- app -->

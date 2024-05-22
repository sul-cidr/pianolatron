<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 1rem;
    gap: 1rem;

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
        flex: 1 0 min-content;
        margin: 0;
        text-align: left;
        padding: 0;
      }

      li {
        display: inline-block;
        border-radius: 6px;
        background-color: darkslategray; // var(--primary-accent);
        color: white;
        padding: 1px 8px 4px;
        margin: 0 4px;
        cursor: pointer;

        button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          margin: 0;
          padding: 0;
        }

        &.active {
          background-color: var(--primary-accent);
        }
      }
    }
  }

  .row-links a {
    color: var(--primary-accent);
    display: inline-block;
    height: 20px;

    :global(svg) {
      height: 24px;
      width: 24px;
    }
  }

  /************************/
  table {
    border-collapse: collapse;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.1),
      0 1px 2px 0 rgba(0, 0, 0, 0.26);
    margin: 0;
    padding: 0;
    table-layout: fixed;
    text-align: left;
    width: 100%;

    th {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      box-sizing: border-box;
      color: #6b7280;
      outline: none;
      overflow: hidden;
      padding: 14px 24px;
      position: relative;
      text-overflow: ellipsis;
      user-select: none;
      vertical-align: middle;
      white-space: nowrap;

      &:not(:first-child) {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDIiIGhlaWdodD0iNDAyIiBzdHlsZT0iZmlsbDojMDAwNCI+PHBhdGggZD0iTTczLjA5MiAxNjQuNDUyaDI1NS44MTNjNC45NDkgMCA5LjIzMy0xLjgwNyAxMi44NDgtNS40MjQgMy42MTMtMy42MTYgNS40MjctNy44OTggNS40MjctMTIuODQ3cy0xLjgxMy05LjIyOS01LjQyNy0xMi44NUwyMTMuODQ2IDUuNDI0QzIxMC4yMzIgMS44MTIgMjA1Ljk1MSAwIDIwMC45OTkgMHMtOS4yMzMgMS44MTItMTIuODUgNS40MjRMNjAuMjQyIDEzMy4zMzFjLTMuNjE3IDMuNjE3LTUuNDI0IDcuOTAxLTUuNDI0IDEyLjg1IDAgNC45NDggMS44MDcgOS4yMzEgNS40MjQgMTIuODQ3IDMuNjIxIDMuNjE3IDcuOTAyIDUuNDI0IDEyLjg1IDUuNDI0ek0zMjguOTA1IDIzNy41NDlINzMuMDkyYy00Ljk1MiAwLTkuMjMzIDEuODA4LTEyLjg1IDUuNDIxLTMuNjE3IDMuNjE3LTUuNDI0IDcuODk4LTUuNDI0IDEyLjg0N3MxLjgwNyA5LjIzMyA1LjQyNCAxMi44NDhMMTg4LjE0OSAzOTYuNTdjMy42MjEgMy42MTcgNy45MDIgNS40MjggMTIuODUgNS40MjhzOS4yMzMtMS44MTEgMTIuODQ3LTUuNDI4bDEyNy45MDctMTI3LjkwNmMzLjYxMy0zLjYxNCA1LjQyNy03Ljg5OCA1LjQyNy0xMi44NDggMC00Ljk0OC0xLjgxMy05LjIyOS01LjQyNy0xMi44NDctMy42MTQtMy42MTYtNy44OTktNS40Mi0xMi44NDgtNS40MnoiLz48L3N2Zz4=);
        background-position-x: calc(100% - 9px);
        background-position-y: 50%;
        background-repeat: no-repeat;
        background-size: 12px;
        cursor: pointer;

        &.sortedAsc {
          background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTIuMzYyIiBoZWlnaHQ9IjI5Mi4zNjEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI5Mi4zNjIgMjkyLjM2MSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTI4Ni45MzUgMTk3LjI4NyAxNTkuMDI4IDY5LjM4MWMtMy42MTMtMy42MTctNy44OTUtNS40MjQtMTIuODQ3LTUuNDI0cy05LjIzMyAxLjgwNy0xMi44NSA1LjQyNEw1LjQyNCAxOTcuMjg3QzEuODA3IDIwMC45MDQgMCAyMDUuMTg2IDAgMjEwLjEzNHMxLjgwNyA5LjIzMyA1LjQyNCAxMi44NDdjMy42MjEgMy42MTcgNy45MDIgNS40MjUgMTIuODUgNS40MjVoMjU1LjgxM2M0Ljk0OSAwIDkuMjMzLTEuODA4IDEyLjg0OC01LjQyNSAzLjYxMy0zLjYxMyA1LjQyNy03Ljg5OCA1LjQyNy0xMi44NDdzLTEuODE0LTkuMjMtNS40MjctMTIuODQ3eiIvPjwvc3ZnPg==);
          background-position-x: calc(100% - 10px);
          background-position-y: 45%;
          background-size: 10px;
        }

        &.sortedDesc {
          background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTIuMzYyIiBoZWlnaHQ9IjI5Mi4zNjIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI5Mi4zNjIgMjkyLjM2MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTI4Ni45MzUgNjkuMzc3Yy0zLjYxNC0zLjYxNy03Ljg5OC01LjQyNC0xMi44NDgtNS40MjRIMTguMjc0Yy00Ljk1MiAwLTkuMjMzIDEuODA3LTEyLjg1IDUuNDI0QzEuODA3IDcyLjk5OCAwIDc3LjI3OSAwIDgyLjIyOGMwIDQuOTQ4IDEuODA3IDkuMjI5IDUuNDI0IDEyLjg0N2wxMjcuOTA3IDEyNy45MDdjMy42MjEgMy42MTcgNy45MDIgNS40MjggMTIuODUgNS40MjhzOS4yMzMtMS44MTEgMTIuODQ3LTUuNDI4TDI4Ni45MzUgOTUuMDc0YzMuNjEzLTMuNjE3IDUuNDI3LTcuODk4IDUuNDI3LTEyLjg0NyAwLTQuOTQ4LTEuODE0LTkuMjI5LTUuNDI3LTEyLjg1eiIvPjwvc3ZnPg==);
          background-position-x: calc(100% - 10px);
          background-position-y: 55%;
          background-size: 10px;
        }

        &:hover,
        &:focus {
          background-color: #e5e7eb;
        }
      }
    }

    th:first-child,
    td:first-child,
    th:last-child,
    td:last-child {
      width: min(17vw, 240px);
    }

    tbody {
      background-color: #fff;
    }

    td {
      border: 1px solid #e5e7eb;
      box-sizing: content-box;
      height: 64px;
      padding: 0 min(1.5%, 24px);

      &:first-child div {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
    }

    tfoot {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;

      div {
        align-items: center;
        display: flex;

        span {
          flex-grow: 1;
        }
      }

      button {
        background-color: #fff;
        border: 1px solid #d2d6dc;
        cursor: pointer;
        padding: 5px 14px;
        user-select: none;

        &[disabled] {
          cursor: not-allowed;
        }

        &:not([disabled]):hover {
          background-color: #f7f7f7;
          color: #3c4257;
        }
      }
    }
  }
</style>

<script>
  import Icon from "../ui-components/Icon.svelte";
  import catalog from "../config/catalog.json";

  // Prep the composerArranger property
  catalog.forEach((item) => {
    item.composerArranger = [
      ...new Set([item.composer, item.arranger].filter(Boolean)),
    ].join("\n");
    item.publisher = `${item.publisher}  [${item.number}]`;
  });

  let filteredListItems = catalog;
  let activeFacet;
  let sortOrder;
  let searchParts = [];
  const pageSize = 10;
  let currentPage = 1;
  let filteredAndPagedItems;

  const searchFields = ["title", "composerArranger", "performer", "publisher"];

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

  const markupMatches = (label) => {
    const matchExtents = [];
    const mergedExtents = [];
    let markedUp = label;
    const searchContent = normalizeText(label);

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

  const prepSearchParts = (text) => {
    searchParts = text
      ? normalizeText(text.replace(/<br>|[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "))
          .split(" ")
          .slice(0, 8)
      : [];
  };

  const paginate = () => {
    filteredAndPagedItems = filteredListItems.slice(
      0 + (currentPage - 1) * pageSize,
      0 + (currentPage - 1) * pageSize + pageSize,
    );
  };

  const itemFilter = async () => {
    filteredListItems = catalog;
    if (activeFacet) {
      filteredListItems = filteredListItems.filter(
        (listItem) => listItem.type === activeFacet,
      );
    }

    if (searchParts.length) {
      filteredListItems = filteredListItems.filter((item) =>
        searchParts.some((searchPart) =>
          searchFields.some((field) =>
            normalizeText(item[field]).includes(searchPart),
          ),
        ),
      );
    }
    currentPage = 1;
    paginate();
  };

  const sortItems = (key) => {
    sortOrder = sortOrder === `${key}-asc` ? `${key}-desc` : `${key}-asc`;
    const asc = sortOrder.endsWith("asc");
    filteredListItems = filteredListItems.sort((a, b) => {
      if (a[key] < b[key]) return asc ? -1 : 1;
      if (a[key] > b[key]) return asc ? 1 : -1;
      return 0;
    });
    currentPage = 1;
    paginate();
  };

  const setActiveFacet = (facet) =>
    (activeFacet = facet === activeFacet ? undefined : facet);
  const facets = [...new Set(catalog.map((item) => item.type))];

  /* eslint-disable no-unused-expressions, no-sequences */
  $: activeFacet, itemFilter();
  $: searchParts, itemFilter();
  $: currentPage, paginate();
</script>

<div id="app">
  <div class="search-box">
    <label for="searchbox">SEARCH:</label>
    <input
      role="textbox"
      id="searchbox"
      tabindex="0"
      class="input"
      spellcheck="false"
      contenteditable="true"
      aria-label="Search"
      aria-multiline="false"
      on:input={(e) => prepSearchParts(e.target.value)}
    />
  </div>
  <!-- search-box -->
  <div class="facets">
    <div class="facet-heading">ROLL TYPE:</div>
    {#if facets}
      <ul>
        {#each facets as facet}
          <li class:active={facet === activeFacet}>
            <button
              class:active={facet === activeFacet}
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
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    Filtered: {filteredListItems?.length} / {catalog.length}
  </div>
  <!-- facets -->
  <table>
    <thead>
      <tr>
        <th>Play/Perform/MIDI/Image</th>
        <th
          tabindex="0"
          on:click={() => sortItems("work")}
          on:keypress={({ key }) => key === "Enter" && sortItems("work")}
          aria-sort={sortOrder === "work-asc"
            ? "ascending"
            : sortOrder === "work-desc"
              ? "descending"
              : null}
          class:sortedAsc={sortOrder === "work-asc"}
          class:sortedDesc={sortOrder === "work-desc"}>Title</th
        >
        <th
          tabindex="0"
          on:click={() => sortItems("composerArranger")}
          on:keypress={({ key }) =>
            key === "Enter" && sortItems("composerArranger")}
          aria-sort={sortOrder === "composerArranger-asc"
            ? "ascending"
            : sortOrder === "composerArranger-desc"
              ? "descending"
              : null}
          class:sortedAsc={sortOrder === "composerArranger-asc"}
          class:sortedDesc={sortOrder === "composerArranger-desc"}
          >Composer / Arranger</th
        >
        <th
          tabindex="0"
          on:click={() => sortItems("performer")}
          on:keypress={({ key }) => key === "Enter" && sortItems("performer")}
          aria-sort={sortOrder === "performer-asc"
            ? "ascending"
            : sortOrder === "performer-desc"
              ? "descending"
              : null}
          class:sortedAsc={sortOrder === "performer-asc"}
          class:sortedDesc={sortOrder === "performer-desc"}>Performer</th
        >
        <th
          tabindex="0"
          on:click={() => sortItems("publisher")}
          on:keypress={({ key }) => key === "Enter" && sortItems("publisher")}
          aria-sort={sortOrder === "publisher-asc"
            ? "ascending"
            : sortOrder === "publisher-desc"
              ? "descending"
              : null}
          class:sortedAsc={sortOrder === "publisher-asc"}
          class:sortedDesc={sortOrder === "publisher-desc"}>Publisher</th
        >
      </tr>
    </thead>
    <tbody>
      {#each filteredAndPagedItems as item}
        {@const imageLink = `https://stacks.stanford.edu/file/${item.druid}/${item.image_url.split("/").slice(-2, -1)[0]}.jp2`}
        <tr>
          <td class="row-links">
            <div>
              <a
                href="/?druid={item.druid}"
                title="Play roll {item.title}"
                target="_blank"
              >
                <Icon name="play" aria-label="Play roll {item.title}" />
              </a>
              <a
                href="/perform/?druid={item.druid}"
                title="Perform roll {item.title}"
                target="_blank"
              >
                <Icon name="piano" aria-label="Perform roll {item.title}" />
              </a>
              <a
                href="/midi/{item.druid}.mid"
                title="Download MIDI for roll {item.title}"
              >
                <Icon
                  name="midi"
                  aria-label="Download MIDI for roll {item.title}"
                />
              </a>
              <a href={imageLink} title="Download image for roll {item.title}">
                <Icon
                  name="roll-image"
                  aria-label="Download image for roll {item.title}"
                />
              </a>
            </div>
          </td>
          <td>
            {@html searchParts.length ? markupMatches(item.work) : item.work}
          </td>
          <td>
            {@html searchParts.length
              ? markupMatches(item.composerArranger).replace("\n", "<br/>")
              : item.composerArranger.replace("\n", "<br/>")}
          </td>
          <td>
            {@html searchParts.length
              ? markupMatches(item.performer)
              : item.performer}
          </td>
          <td>
            {@html searchParts.length
              ? markupMatches(item.publisher)
              : item.publisher}
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5">
          <div>
            {#if filteredListItems.length === 0}
              No results
            {:else}
              {@const pageStart = pageSize * (currentPage - 1) + 1}
              <span>
                Showing <strong>{pageStart}</strong> to
                <strong>
                  {Math.min(pageStart + pageSize - 1, filteredListItems.length)}
                </strong>
                of <strong>{filteredListItems.length}</strong>
              </span>

              <button
                disabled={currentPage === 1}
                on:click={() => (currentPage -= 1)}
                on:keypress={({ code }) => {
                  if (code === "Enter") currentPage -= 1;
                }}
              >
                &laquo; Previous
              </button>
              <button
                disabled={currentPage * pageSize >= filteredListItems.length}
                on:click={() => (currentPage += 1)}
                on:keypress={({ code }) => {
                  if (code === "Enter") currentPage += 1;
                }}
              >
                Next &raquo;
              </button>
            {/if}
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
</div>
<!-- app -->

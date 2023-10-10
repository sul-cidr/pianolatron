<script>

export let uiComponent;
export let labelFieldName;
export let searchFieldName = labelFieldName;
export let facetFieldName;
export let items = [];
export let listItems = [];

let filteredListItems;
let activeFacet;
let facets = [];

let input;

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


const longSubstitutionsRegex = new RegExp(
  Object.keys(unDecomposableMap)
    .filter((k) => unDecomposableMap[k].length > 1)
    .join("|"),
  "gi",
);

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

const setActiveFacet = async (facet) => {
    activeFacet = facet === activeFacet ? undefined : facet;
};

const itemFilter = async () => {
    if (activeFacet) {
      filteredListItems = listItems.filter(
        (listItem) => listItem.item[facetFieldName] === activeFacet,
      );
    } else {
      filteredListItems = listItems;
    }


    console.log(input);
    if (!input || !input.innerHTML) return;

    
    const filteredText = normalizeText(
      input.innerHTML.replace(/<br>|[&/\\#,+()$~%.'":*?<>{}]|nbsp;/g, " "),
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
   
}

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

$: items, prepareListItems();

</script>

<div class="search" >
  <svelte:component 
    this={uiComponent} 
    bind:input={input}
    {listItems}
    {filteredListItems}
    {facets}
    {itemFilter}
    {activeFacet}
    {setActiveFacet}
    {...$$props}
    {...$$restProps}
  />
</div>
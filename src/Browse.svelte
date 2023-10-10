<style>

</style>

<script>
  import catalog from "./config/catalog.json";
  import Search from "./components/Search.svelte";
  import SearchGrid from "./ui-components/SearchGrid.svelte";

  let currentRoll;
  const items = catalog.map((item) => ({
    ...item,
    _label: `${item.number} ${item.title} [${item.publisher}]`,
  }));
</script>

<Search
  uiComponent={SearchGrid}
  {items}
  bind:selectedItem={currentRoll}
  labelFieldName="_label"
  searchFieldName="_label"
  facetFieldName="type"
  placeHolder="<span class='place-holder'>Search</span>"
  postMarkup={(str) =>
    str.replace(/^(?:[\S.]|<\/?mark>)+|\[[^\]]+\]$/g, "<small>$&</small>")}
/>
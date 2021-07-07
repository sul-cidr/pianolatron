<style lang="scss">
  :global(small) {
    color: grey;
    display: inline-block;
    text-align: right;
    margin-right: 1ch;

    &:first-child {
      width: 5ch;
    }
  }
</style>

<script>
  import FilteredSelect from "../ui-components/FilteredSelect.svelte";
  import catalog from "../assets/catalog.json";

  const listItems = catalog.map((item) => ({
    ...item,
    _label: `${item.label.match(/^\d+/)} ${item.title} [${item.label.replace(
      /^\d*\s?/,
      "",
    )}]`,
  }));
  export let currentRoll =
    listItems[Math.floor(Math.random() * catalog.length)];
</script>

<FilteredSelect
  items={listItems}
  bind:selectedItem={currentRoll}
  labelFieldName="_label"
  searchFieldName="_label"
  postMarkup={(str) => str.replace(/^\d+|\[[^\]]+\]$/g, "<small>$&</small>")}
/>

<style lang="scss">
  :global(.filtered-select small) {
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

  export let rollListItems;
  export let currentRoll;
</script>

<FilteredSelect
  items={rollListItems}
  bind:selectedItem={currentRoll}
  labelFieldName="_label"
  searchFieldName="_label"
  facetFieldName="type"
  postMarkup={(str) => str.replace(/^[\d.]+|\[[^\]]+\]$/g, "<small>$&</small>")}
/>

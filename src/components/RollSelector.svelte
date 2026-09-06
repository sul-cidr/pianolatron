<style lang="scss">
  :global(small) {
    color: var(--light-grey);
    display: inline-block;
    text-align: center;
    margin-right: 1ch;
    white-space: nowrap;

    &:first-child {
      width: 5ch;
    }
  }

  :global(.place-holder) {
    color: var(--light-grey);
  }
</style>

<script>
  import FilteredSelect from "../ui-components/FilteredSelect.svelte";

  export let rollListItems;
  export let currentRoll = undefined;
</script>

<FilteredSelect
  items={rollListItems}
  bind:selectedItem={currentRoll}
  labelFieldName="_label"
  searchFieldName="_label"
  facetFieldName="type"
  placeHolder="<span class='place-holder'>Select a roll...</span>"
  ariaLabel="Select a roll"
  postMarkup={(str) =>
    str.replace(/^(?:[\S.]|<\/?mark>)+|\[[^\]]+\]$/g, "<small>$&</small>")}
/>

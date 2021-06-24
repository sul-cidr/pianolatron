<script>
  import FilteredSelect from "../ui-components/FilteredSelect.svelte";
  import catalog from "../assets/catalog.json";

  export let currentRoll = catalog[Math.floor(Math.random() * catalog.length)];
</script>

<FilteredSelect
  items={catalog}
  bind:selectedItem={currentRoll}
  labelFieldName="title"
  searchFieldName="title"
/>

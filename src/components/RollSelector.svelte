<script>
  // bundling this, for now at least
  import catalog from "../assets/catalog.json";

  export let currentRollDruid;
</script>

<select bind:value={currentRollDruid}>
  {#each Object.entries(catalog) as [druid, roll]}
    <option value={druid}>{roll.title}</option>
  {/each}
</select>

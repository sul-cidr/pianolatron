<style>
  select {
    margin: 1em;
    padding: 0.25em 0;
  }
</style>

<script>
  // bundling this, for now at least
  import catalog from "../assets/catalog.json";

  export let currentRoll = catalog[Math.floor(Math.random() * catalog.length)];
</script>

<select bind:value={currentRoll}>
  {#each catalog as roll}
    <option value={roll}>{roll.title}</option>
  {/each}
</select>

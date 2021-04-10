<script>
  // bundling this, for now at least
  import catalog from "../assets/catalog.json";

  export let currentRoll;
</script>

<select bind:value={currentRoll}>
  {#each catalog as roll}
    <option value={roll}>{roll.title}</option>
  {/each}
</select>

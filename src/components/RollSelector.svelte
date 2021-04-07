<script>
  // bundling this, for now at least
  import catalog from "../assets/catalog.json";

  export let loadRoll;
</script>

<!-- svelte-ignore a11y-no-onchange -->
<!-- I've ignored this a11y rule -- the equivalent jsx-a11y rule has been deprecated
     (see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/no-onchange.md)
     -- but I'm not sure how comfortable I am with it in this case.  See
     https://github.com/sveltejs/svelte/issues/4946 for further discussion. -->
<select on:change={({ target: { value } }) => loadRoll(value, catalog[value])}>
  {#each Object.entries(catalog) as [druid, roll]}
    <option value={druid}>{roll.title}</option>
  {/each}
</select>

<style lang="scss">
  .search-table {
    margin: 0 auto;
    width: 90%;
    td {
      font-size: 12px;
    }
  }

</style>

<script>
  import { onMount } from 'svelte';
  import catalog from '../config/catalog.json';
  import itemsjs from "itemsjs";
  export const configuration = {
    custom_id_field: "druid", // 'id' is a default one but we can also use 'uuid' and other if necessary
    aggregations: {
      arranger: {
        title: "Arranger",
        size: 10,
        conjunction: true,
      },
      composer: {
        title: "Composer",
        size: 10,
        conjunction: true,
      },
      druid: {
        title: "ID",
        size: 10,
        conjunction: true,
      },
      number: {
        title: "Number",
        size: 10,
        conjunction: true,
      },
      performer: {
        title: "Performer",
        size: 10,
        conjunction: true,
      },
      publisher: {
        title: "Publisher",
        size: 10,
        conjunction: true,
      },
      title: {
        title: "Title",
        size: 10,
        conjunction: true,
      },
      type: {
        title: "Type",
        size: 10,
        conjunction: true,
      },
      work: {
        title: "Work",
        size: 10,
        conjunction: true,
      },
    },
    sortings: {
      arranger_asc: {
        field: 'arranger',
        order: 'asc'
      },
      arranger_desc: {
        field: 'arranger',
        order: 'desc'
      },
      title_asc: {
        field: 'title',
        order: 'asc'
      },
      title_desc: {
        field: 'title',
        order: 'desc'
      },
      publisher_asc: {
        field: 'publisher',
        order: 'asc'
      },
      publisher_desc: {
        field: 'publisher',
        order: 'desc'
      },
      composer_asc: {
        field: 'composer',
        order: 'asc'
      },
      composer_desc: {
        field: 'composer',
        order: 'desc'
      },
    },
    searchableFields: ['arranger',
      'composer',
      'druid',
      'image_url',
      'number',
      'performer',
      'publisher',
      'title',
      'type',
      'work',
    ],
  };

  export const compositions = itemsjs(catalog, configuration);
  export let results = compositions.search({
        per_page: 50,
        sort: 'composer_desc'
      })

  export let searchCompositons
  export let textSearchCompositons

	onMount(() => {
    searchCompositons = val => {
      results = compositions.search({
        per_page: 50,
        sort: val
      })
      return results;

    }

    textSearchCompositons = val => {
      results = compositions.search({
        per_page: 50,
        query: val
      })
      return results;
    }
  })


</script>

<h1>Super Simple Sorted List</h1>
  <input on:change={(e) => {
    textSearchCompositons(e.target.val)
  }} placeholder="Search" />
  <table class="search-table">
    <tr>
      <th>ID</th>
      <th on:click={() => {
        searchCompositons('title_asc');
      }}>Title</th>
      <th on:click={() => (searchCompositons('composer_asc'))}>Composer</th>
      <th>Arranger</th>
      <th>Performer</th>
      <th>Publisher</th>
      <th>Type</th>
      <th>Number</th>
      <th>Work</th>
    </tr>
    {#if results?.data.items.length > 0}
      {#each results.data.items as listing}
        <tr>
          <td>{listing.druid}</td>
          <td>{listing.title}</td>
          <td>{listing.composer}</td>
          <td>{listing.arranger}</td>
          <td>{listing.performer}</td>
          <td>{listing.publisher}</td>
          <td>{listing.type}</td>
          <td>{listing.number}</td>
          <td>{listing.work}</td>
        </tr>
      {/each}
    {:else}
        <tr><td colspan="6" class="search-results-empty">There are no results at this time.</td></tr>
    {/if}
  </table>



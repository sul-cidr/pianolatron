<style lang="scss">
  .search-container {
    display: flex;
    flex-direction:row;
    gap: 1rem;
    justify-content: space-between;
  }
  .search-filters {
    margin: 0 auto;
    padding: 10px;
    ul {
      list-style-type: none;
      padding-left: 10px;
      padding-top: 5px;
      li {
        font-size: 11px;
        input {
          cursor: pointer;
          margin-right: 5px;
          vertical-align: top;
        }
      }
    }
  }
  .search-input {
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    margin: 1rem 1rem 1rem 5rem;
    padding: 5px;
    width: 80%;
  }
  .search-totals {
    font-size: 12px;
    text-align: right;
    padding-right: 10%;
  }
  .search-table {
    margin: 0 auto;
    table-layout: fixed;
    width: 90%;
    th {
      cursor: pointer;
    }
    td {
      font-size: 12px;
      padding: 0.125rem 1rem;
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
      publisher: {
        title: "Publisher",
        size: 10,
        conjunction: true,
      },
      type: {
        title: "Type",
        size: 10,
        conjunction: true,
      },
      composer: {
        title: "Composer",
        size: 100,
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
      composer_asc: {
        field: 'composer',
        order: 'asc'
      },
      composer_desc: {
        field: 'composer',
        order: 'desc'
      },
      number_asc: {
        field: 'composer',
        order: 'asc'
      },
      number_desc: {
        field: 'composer',
        order: 'desc'
      },
      performer_asc: {
        field: 'composer',
        order: 'asc'
      },
      performer_desc: {
        field: 'composer',
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
      title_asc: {
        field: 'title',
        order: 'asc'
      },
      title_desc: {
        field: 'title',
        order: 'desc'
      },
      type_asc: {
        field: 'type',
        order: 'asc'
      },
      type_desc: {
        field: 'type',
        order: 'desc'
      },
      work_asc: {
        field: 'work',
        order: 'asc'
      },
      work_desc: {
        field: 'work',
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

  let filters = {
    arranger: [],
    composer: [],
    number: [],
    performer: [],
    publisher: [],
    title: [],
    type: [],
    work: [],
  }

  let sort = ['title_asc']

  const compositions = itemsjs(catalog, configuration);
  let results;
  
  const searchCompositons = (query = "" ) => {
    results = compositions.search({
      per_page: 50,
      sort,
      query,
      filters
    })
  }

  const updateSort = (columnName = "") => {
    const currentSort = sort[0].split('_')
    currentSort[0] === columnName
      ? currentSort[1] === 'asc'
        ? sort = [`${columnName}_desc`]
        : sort = [`${columnName}_asc`]
      : sort = [`${columnName}_asc`]
    searchCompositons()
  }

  const updateFilters = (filter) => {
    const filterCategory = Object.keys(filter)[0]
    const existingFilterState = 
      results.data.aggregations[filterCategory].buckets.filter(b => b.key === filter[filterCategory][0])[0]
    existingFilterState.selected 
      ?
        filters = { ...filters, ...filter }
      : 
        filters = filters[filterCategory].filter(f => f !== existingFilterState.key)
    searchCompositons()
  }

	onMount(() => {
    searchCompositons();
    console.log(results);
  })
  
</script>
  <div class="search-container">
    <div class="search-filters">
      <h2>Filters</h2>
      <h3>Publisher</h3>
      <ul>
        {#if results?.data.aggregations.publisher.buckets.length > 0}
          {#each results.data.aggregations.publisher.buckets as publisher}
            {#if publisher.doc_count > 0}
              <li><input type="checkbox" bind:checked={publisher.selected} on:change={() => updateFilters({publisher: [publisher.key]})} />{publisher.key} <span>{publisher.doc_count}</span></li>
            {/if}
          {/each}
        {/if}
      </ul>
      <h3>Type</h3>
      <ul>
        {#if results?.data.aggregations.type.buckets.length > 0}
          {#each results.data.aggregations.type.buckets as type}
            {#if type.doc_count > 0}
              <li><input type="checkbox" bind:checked={type.selected} on:change={() => updateFilters({type: [type.key]})} value={type.selected} />{type.key} <span>{type.doc_count}</span></li>
            {/if}
          {/each}
        {/if}
      </ul>
      <h3>Composer</h3>
      <ul>
        {#if results?.data.aggregations.composer.buckets.length > 0}
          {#each results.data.aggregations.composer.buckets as composer}
            {#if composer.doc_count > 0}
              <li><input type="checkbox"  bind:checked={composer.selected} on:change={() => updateFilters({composer: [composer.key]})} value={composer.selected} />{composer.key} <span>{composer.doc_count}</span></li>
            {/if}
          {/each}
        {/if}
      </ul>
    </div>
    <div>
      <input on:input={({target}) => searchCompositons(target.value)} placeholder="Search" class="search-input"/>
      <div class="search-totals">Showing {results?.pagination.total < results?.pagination.per_page ? results?.pagination.total : results?.pagination.per_page} of {results?.pagination.total} results</div>
      <table class="search-table">
        <tr>
          <th>ID</th>
          <th on:click={() => updateSort('title') }>Title</th>
          <th on:click={() => updateSort('composer')}>Composer</th>
          <th on:click={() => updateSort('arranger')}>Arranger</th>
          <th on:click={() => updateSort('performer')}>Performer</th>
          <th on:click={() => updateSort('publisher')}>Publisher</th>
          <th on:click={() => updateSort('type')}>Type</th>
          <th on:click={() => updateSort('number')}>Number</th>
          <th on:click={() => updateSort('work')}>Work</th>
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
            <tr><td colspan="9" class="search-results-empty">There are no results at this time.</td></tr>
        {/if}
      </table>
    </div>
  </div>

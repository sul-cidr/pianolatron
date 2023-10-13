<style lang="scss">
    @import "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";
</style>
<script>
    import { beforeUpdate, afterUpdate} from 'svelte';
    import Grid from "gridjs-svelte"
    import { SvelteWrapper } from "gridjs-svelte/plugins";
    import { html } from "gridjs";
    import catalog from "../config/catalog.json";
    let grid = false;

    const getLinksForCell = (druid) => {
        return html(`
        <a href="/?druid=${druid}">Listen</a><br/>
        <a href="/perform/?druid=${druid}">Perform</a>
        `)
    }

    const data = catalog.map((item) => ([
        getLinksForCell(item.druid),
        `${item.number} ${item.title} [${item.publisher}]`,
        [ ...new Set([item.composer, item.arranger, item.performer, item.publisher])].filter(Boolean).join("; "),
        item.druid,
        item.type
    ]));

    beforeUpdate(async () => {
        if (grid) {
            grid.instance.config.plugin.remove("pagination");
            grid.instance.config.plugin.remove("search");
        }
    }); 
    
    const columns = [
        {
            id: "links",
            name: "",
            sort: false
        },
        {
            name: "Label",
            sort: true
        },
        {
            name: "Creators",
            sort: false
        },
        {
            name: "Druid",
            sort: false
        },
        {
            name: "Type",
            sort: true
        },
    ];
    
    const pagination = {
		enabled: true,
		limit: 10
	};

    const search =  true;
</script>

<Grid {data} {columns} {pagination} {search} bind:this={grid} />
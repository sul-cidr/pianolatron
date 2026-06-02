<style lang="scss">
  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em 0em 0.5em;
  }

  dt {
    color: var(--cardinal-red-dark);
    font-family: SourceSerif4, serif;
    font-size: 0.9em;
    margin-top: 1em;
    margin-bottom: 0.2em;
    text-transform: uppercase;
    display: inline-block;
    width: 100%;

    &::first-letter {
      font-size: 1.3em;
    }

    &:not(.large)::after {
      content: ":";
    }
  }

  dd {
    color: var(--black);
    font-family: SourceSans3, sans-serif;
    display: inline;
    overflow-wrap: anywhere;

    &.large {
      font-size: 1.6em;
      display: block;
    }
  }

  dd:not(:has(a)) {
    text-transform: capitalize;
  }

  dd :global(span) {
    opacity: 0.5;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    line-height: 1rem;
    padding: 0 0 10px;
  }

  li a {
    font-size: 1rem;
    text-decoration: none;
  }

  li a:hover {
    text-decoration: underline;
  }

  .download-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-left: 0.5rem;
    flex-wrap: wrap;
  }

  .download-links a {
    color: var(--link-blue);
    height: 20px;

    :global(svg) {
      height: 36px;
      width: 36px;
    }
  }
</style>

<script>
  import Icon from "../ui-components/Icon.svelte";
  import catalog from "../config/catalog.json";

  import { appMode } from "../stores";

  export let metadata;

  export const similarWorksByPerformer = catalog.filter(
    (w) => w.performer === metadata.performer && w.druid !== metadata.druid,
  );

  const imageLink = `https://stacks.stanford.edu/file/${metadata.druid}/${metadata.image_url.split("/").slice(-2, -1)[0]}.jp2`;
  const unavailable = "<span>Unavailable</span>";
</script>

<dl>
  <dt>Title</dt>
  <dd class="large">
    {@html metadata.title || unavailable}
  </dd>
  {#if metadata.performer}
    <dt>Performer</dt>
    <dd class="large">
      {@html metadata.performer || unavailable}
    </dd>
  {/if}
  <dt>Composer</dt>
  <dd class="large">
    {@html metadata.composer || unavailable}
  </dd>
  {#if metadata.arranger}
    <dt>Arranger</dt>
    <dd class="large">
      {@html metadata.arranger || unavailable}
    </dd>
  {/if}
  {#if metadata.original_composer}
    <dt>Composer (original)</dt>
    <dd class="large">
      {@html metadata.original_composer || unavailable}
    </dd>
  {/if}
  <dt>Label/Publisher</dt>
  <dd class="large">
    {@html metadata.label || unavailable}
  </dd>
  {#if similarWorksByPerformer.length > 0}
    <dt>Other Rolls Featuring This Performer</dt>
    <dd class="large">
      <ul>
        {#each similarWorksByPerformer as work}
          <li>
            <a
              href={`${$appMode === "perform" ? "/perform/" : "/"}?druid=${work.druid}`}
              target="_blank">{@html work.title}</a
            >
          </li>
        {/each}
      </ul>
    </dd>
  {/if}
  <dt>Archive Record</dt>
  <dd>
    <a href={metadata.PURL} target="_blank"
      >{@html metadata.PURL.replace("https://", "") || unavailable}</a
    >
  </dd>
  {#if metadata.work}
    <dt>Work</dt>
    <dd class="large">
      {@html metadata.work || unavailable}
    </dd>
  {/if}
  <dt>Download</dt>
  <dd>
    <div class="download-links">
      <div>
        <a
          href="/midi/{metadata.druid}.mid"
          title="Download MIDI for roll {metadata.title}"
        >
          <Icon
            name="midi"
            aria-label="Download MIDI for roll {metadata.title}"
          />
        </a>
      </div>
      <div>
        <a href={imageLink} title="Download image for roll {metadata.title}">
          <Icon
            name="roll-image"
            aria-label="Download image for roll {metadata.title}"
          />
        </a>
      </div>
    </div>
  </dd>
  <dt>Roll Type</dt>
  <dd class="large">
    {#if metadata.type === "welte-red"}
      T-100 “Red” Welte
    {:else if metadata.type === "welte-green"}
      T-98 “Green” Welte
    {:else if metadata.type === "welte-licensee"}
      Welte Licensee
    {:else if metadata.type === "duo-art"}
      Duo-Art
    {:else if metadata.type === "ampico-a"}
      Ampico (A)
    {:else if metadata.type === "ampico-b"}
      Ampico (B)
    {:else if metadata.type === "65-note"}
      65-note Pianola
    {:else}
      88-note Pianola
    {/if}
  </dd>
</dl>

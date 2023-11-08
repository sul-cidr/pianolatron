<style lang="scss">

  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em;
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
</style>

<script>
  export let metadata;

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
  <dt>Label</dt>
  <dd class="large">
    {@html metadata.label || unavailable}
  </dd>
  <dt>Publisher</dt>
  <dd class="large">
    {@html metadata.publisher || unavailable}
  </dd>
  <dt>PURL</dt>
  <dd>
    <a href={metadata.PURL} target='_blank'>{@html metadata.PURL || unavailable}</a>
  </dd>
  {#if metadata.work}
    <dt>Work</dt>
    <dd class="large">
      {@html metadata.work || unavailable}
    </dd>
  {/if}
</dl>

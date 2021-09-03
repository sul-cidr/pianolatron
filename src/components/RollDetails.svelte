<style lang="scss">
  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em;
  }

  dt {
    font-family: $primary-typeface;
    font-size: 1.4em;
    margin-top: 0.5em;
    margin-bottom: 0.2em;
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
  <dd>
    {@html metadata.title || unavailable}
  </dd>
  <dt>Performer</dt>
  <dd>
    {@html metadata.performer || unavailable}
  </dd>
  <dt>Composer</dt>
  <dd>
    {@html metadata.composer || unavailable}
  </dd>
  <dt>Label</dt>
  <dd>
    {@html metadata.label || unavailable}
  </dd>
  <dt>PURL</dt>
  <dd>
    <a href={metadata.PURL}>{@html metadata.PURL || unavailable}</a>
  </dd>
  <dt>Call No</dt>
  <dd>
    {@html metadata.CALLNUM || unavailable}
  </dd>
</dl>

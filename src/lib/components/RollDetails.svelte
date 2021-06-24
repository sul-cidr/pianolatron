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
  import { rollMetadata } from "../stores";

  const unavailable = "<span>Unavailable</span>";
</script>

<dl>
  <dt>Title</dt>
  <dd>
    {@html $rollMetadata.TITLE || $rollMetadata.title || unavailable}
  </dd>
  <dt>Performer</dt>
  <dd>
    {@html $rollMetadata.PERFORMER || $rollMetadata.performer || unavailable}
  </dd>
  <dt>Composer</dt>
  <dd>
    {@html $rollMetadata.COMPOSER || $rollMetadata.composer || unavailable}
  </dd>
  <dt>Label</dt>
  <dd>
    {@html $rollMetadata.LABEL || $rollMetadata.label || unavailable}
  </dd>
  <dt>PURL</dt>
  <dd>
    <a href={$rollMetadata.PURL}>{@html $rollMetadata.PURL || unavailable}</a>
  </dd>
  <dt>Call No</dt>
  <dd>
    {@html $rollMetadata.CALLNUM || unavailable}
  </dd>
</dl>

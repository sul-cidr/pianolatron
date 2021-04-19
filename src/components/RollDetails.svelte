<style lang="scss">
  dl {
    display: block;
    margin: 1em;
    padding: 0.5em 1em;
  }

  dt {
    font-family: $primary-typeface;
    font-size: 1.4em;
    margin-top: 0.5em;
    margin-bottom: 0.2em;
  }
</style>

<script>
  import { rollMetadata } from "../stores";
</script>

<dl>
  <dt>Title</dt>
  <dd>{$rollMetadata.TITLE || $rollMetadata.title || 'Unavailable'}</dd>
  <dt>Performer</dt>
  <dd>{$rollMetadata.PERFORMER || $rollMetadata.performer || 'Unavailable'}</dd>
  <dt>Composer</dt>
  <dd>{$rollMetadata.COMPOSER || $rollMetadata.composer || 'Unavailable'}</dd>
  <dt>Label</dt>
  <dd>{$rollMetadata.LABEL || $rollMetadata.label || 'Unavailable'}</dd>
  <dt>PURL</dt>
  <dd>
    <a href={$rollMetadata.PURL}>{$rollMetadata.PURL || 'Unavailable'}</a>
  </dd>
  <dt>Call No</dt>
  <dd>{$rollMetadata.CALLNUM || 'Unavailable'}</dd>
</dl>

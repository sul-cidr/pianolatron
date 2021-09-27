<style lang="scss">
  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em;
  }

  dt {
    font-family: $primary-typeface;
    font-size: 0.9em;
    margin-top: 1em;
    margin-bottom: 0.2em;
    text-transform: uppercase;
    color: rgba(black, 0.6);
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
    font-family: $primary-typeface;
    display: inline;

    &.large {
      font-size: 1.4em;
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
  <dt>Performer</dt>
  <dd class="large">
    {@html metadata.performer || unavailable}
  </dd>
  <dt>Composer</dt>
  <dd class="large">
    {@html metadata.composer || unavailable}
  </dd>
  <dt>Label</dt>
  <dd class="large">
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

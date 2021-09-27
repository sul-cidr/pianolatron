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
    overflow-wrap: anywhere;

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

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: inline-block;
    background-color: #999;
    border-radius: 4px;
    line-height: 0.9em;
    min-width: 3ch;
    text-align: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--primary-accent);
    }

    a {
      text-decoration: none;
      font-size: 0.9em;
      color: white;
      padding: 2px 4px;
      display: inline-block;

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>

<script>
  import { tooltip } from "../lib/tooltip-action";

  export let metadata;
  export let druid;

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
  <dt>Links</dt>
  <dd>
    <ul>
      <li>
        <a
          use:tooltip={"Stanford Digital Repository entry for this roll"}
          href={metadata.PURL}
          target="purl"
        >
          SDR
        </a>
      </li>
      <li>
        <a
          use:tooltip={"Image Analysis Report for this roll at the SUPRA site"}
          href={`https://supra.stanford.edu/image-analysis/?druid=${druid}`}
          target="image-analysis"
        >
          IA
        </a>
      </li>
      <li>
        <a
          use:tooltip={"Drift Analysis Report for this roll at the SUPRA site"}
          href={`https://supra.stanford.edu/drift/?druid=${druid}`}
          target="drift"
        >
          D
        </a>
      </li>
      <li>
        <a
          use:tooltip={"Download the “Expressive” MIDI file for this roll"}
          href={`https://github.com/pianoroll/SUPRA/blob/master/welte-red/midi-exp/${druid}_exp.mid?raw=true`}
        >
          Mexp
        </a>
      </li>
      <li>
        <a
          use:tooltip={"Download the Raw MIDI file for this roll"}
          href={`https://github.com/pianoroll/SUPRA/blob/master/welte-red/midi-raw/${druid}_exp.mid?raw=true`}
        >
          Mraw
        </a>
      </li>
      <li><a href={metadata.PURL}>MP4</a></li>
      <li><a href={metadata.PURL}>MP3</a></li>
    </ul>
  </dd>
</dl>

<style>
  ul {
    background: beige;
    border-bottom: 1px solid black;
    columns: 2;
    display: block;
    list-style: none;
    margin: 0;
    padding: 0.5em 2em;
  }

  strong {
    display: inline-block;
    width: 6em;
  }
</style>

<script>
  export let rollMetadata;
</script>

<ul>
  <li><strong>Title:</strong> {rollMetadata.TITLE}</li>
  <li><strong>Performer:</strong> {rollMetadata.PERFORMER}</li>
  <li><strong>Composer:</strong> {rollMetadata.COMPOSER}</li>
  <li><strong>Label:</strong> {rollMetadata.LABEL}</li>
  <li>
    <strong>PURL:</strong>
    <a href="{rollMetadata.PURL}">{rollMetadata.PURL}</a>
  </li>
  <li><strong>Call No:</strong> {rollMetadata.CALLNUM}</li>
</ul>

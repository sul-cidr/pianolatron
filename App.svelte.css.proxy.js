// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-1s3dlkg.svelte-1s3dlkg{display:grid;grid-template-rows:1fr auto;grid-template-columns:auto 1fr auto;grid-template-areas:\"left roll right\" \"keyboard keyboard keyboard\";height:100vh}#roll-details.svelte-1s3dlkg.svelte-1s3dlkg{grid-area:left;max-width:calc(348px + 2em)}#roll-details.svelte-1s3dlkg p.svelte-1s3dlkg{margin:1em;opacity:0.5;padding:0.5em 1em}#roll.svelte-1s3dlkg.svelte-1s3dlkg{grid-area:roll}#audio-controls.svelte-1s3dlkg.svelte-1s3dlkg{grid-area:right}#keyboard-container.svelte-1s3dlkg.svelte-1s3dlkg{grid-area:keyboard}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
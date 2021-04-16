// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-6exmy8{display:grid;grid-template-rows:1fr auto;grid-template-columns:auto 1fr auto;grid-template-areas:\"left roll right\"\n      \"keyboard keyboard keyboard\";height:100vh}#roll-details.svelte-6exmy8{grid-area:left}#roll.svelte-6exmy8{grid-area:roll}#audio-controls.svelte-6exmy8{grid-area:right}#keyboard.svelte-6exmy8{grid-area:keyboard}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
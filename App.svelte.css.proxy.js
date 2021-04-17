// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-1d08kzi{display:grid;grid-template-rows:1fr auto;grid-template-columns:auto 1fr auto;grid-template-areas:\"left roll right\"\n      \"keyboard keyboard keyboard\";height:100vh}#roll-details.svelte-1d08kzi{grid-area:left}#roll.svelte-1d08kzi{grid-area:roll}#audio-controls.svelte-1d08kzi{grid-area:right}#keyboard-container.svelte-1d08kzi{grid-area:keyboard}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
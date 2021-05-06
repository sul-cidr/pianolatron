// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-settings.svelte-1cq4iz3{overflow-y:auto}.control.svelte-1cq4iz3{align-items:center;display:grid;gap:0.5em;padding:0.5em;grid:\"title value\" auto \"slider slider\" auto/1fr auto}.control.svelte-1cq4iz3 input[type=\"range\"]{grid-area:slider;width:100%}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
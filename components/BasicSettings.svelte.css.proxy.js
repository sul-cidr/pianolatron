// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-settings.svelte-1fdvi3y{overflow-y:auto}.control.svelte-1fdvi3y{align-items:center;display:grid;gap:0.5em;padding:0 0.5em 0.5em;grid:\"title value\" auto \"slider slider\" auto/1fr auto}.control.svelte-1fdvi3y input[type=\"range\"]{grid-area:slider;width:100%}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-settings.svelte-1ms9wt8{overflow-y:auto}.control.svelte-1ms9wt8{align-items:center;display:grid;gap:0.5em;padding:0.5em;grid:\"title value\" auto \"slider slider\" auto/1fr auto}.control.svelte-1ms9wt8 input[type=\"range\"]{grid-area:slider;width:100%}kbd.svelte-1ms9wt8{display:inline-block;padding:5px 5px}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
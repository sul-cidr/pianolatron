// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-controls.svelte-16dxflf{margin:0 0.5em}.control.svelte-16dxflf{align-items:center;display:grid;gap:0.5em;padding:0.5em 0;grid:\"title value\" auto \"slider slider\" auto/1fr auto}.control.svelte-16dxflf input[type=\"range\"]{grid-area:slider;width:100%}button.svelte-16dxflf{display:inline-block;padding:0.35em 0.8em;border:0.1em solid #ffffff;margin:0;border-radius:0.25em;color:#ffffff;transition:all 0.2s;background-color:var(--primary-accent)}button.svelte-16dxflf:hover,button.pedal-on.svelte-16dxflf{color:var(--primary-accent);border-color:var(--primary-accent);background-color:#ffffff}button.pedal-on.svelte-16dxflf{background-color:yellow}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
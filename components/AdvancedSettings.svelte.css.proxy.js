// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div#settings-panel.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{background:var(--background-color);height:100%;left:0;position:absolute;top:0;width:100%}div#settings-panel.svelte-oulsvg div.svelte-oulsvg+div.svelte-oulsvg{margin-top:1em}fieldset.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{margin:2em 0;padding:1em 0.75em}fieldset.svelte-oulsvg div.svelte-oulsvg.svelte-oulsvg{display:flex;justify-content:space-between}legend.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{font-family:serif;font-size:1.4em}button.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{height:1.5em;width:1.5em;border-radius:1.5em;border:none;margin:0 0.5em}button.active.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{outline:1px solid var(--primary-accent);outline-offset:4px}button.cardinal.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{background:#8c1515}button.blue.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{background:steelblue}button.green.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{background:darkolivegreen}button.grey.svelte-oulsvg.svelte-oulsvg.svelte-oulsvg{background:darkslategrey}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
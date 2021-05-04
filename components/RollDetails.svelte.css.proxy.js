// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "dl.svelte-hdqs3f{display:block;padding:0.5em 1em}dt.svelte-hdqs3f{font-family:serif;font-size:1.4em;margin-top:0.5em;margin-bottom:0.2em}dd.svelte-hdqs3f:not(:has(a)){text-transform:capitalize}dd.svelte-hdqs3f span{opacity:0.5}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
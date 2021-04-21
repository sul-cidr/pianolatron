// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "dl.svelte-tigkkf{display:block;margin:1em;padding:0.5em 1em}dt.svelte-tigkkf{font-family:serif;font-size:1.4em;margin-top:0.5em;margin-bottom:0.2em}dd.svelte-tigkkf:not(:has(a)){text-transform:capitalize}dd.svelte-tigkkf span{opacity:0.5}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
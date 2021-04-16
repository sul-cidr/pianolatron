// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "dl.svelte-191eahf{display:block;margin:1em;padding:0.5em 1em}dt.svelte-191eahf{font-family:serif;font-size:1.4em;margin-top:0.5em;margin-bottom:0.2em}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
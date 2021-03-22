// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "ul.svelte-76gl8c{background:beige;border-bottom:1px solid black;columns:2;display:block;list-style:none;margin:0;padding:0.5em 2em}strong.svelte-76gl8c{display:inline-block;width:6em}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div.svelte-yluqog{left:1em;top:0;transform:translateY(-100%);border-radius:4px 4px 0 0;padding:0;opacity:0;transition:all 0.3s ease}div.svelte-yluqog:hover{opacity:1}button.svelte-yluqog{border-radius:4px 4px 0 0}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
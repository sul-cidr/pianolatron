// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div.svelte-8m4lb4{left:1em;top:0;transform:translateY(-100%);border-radius:4px 4px 0 0;padding:0;opacity:0;transition:all 0.3s ease}div.svelte-8m4lb4:hover{opacity:1}div.outside.svelte-8m4lb4{bottom:0;left:0;top:unset;opacity:1;border-radius:0 4px 4px 0}button.svelte-8m4lb4{border-radius:4px 4px 0 0}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div.svelte-14r7ie4.svelte-14r7ie4{text-align:right}input.svelte-14r7ie4.svelte-14r7ie4{display:none}label.svelte-14r7ie4.svelte-14r7ie4{display:inline-block;padding:0.2em 0.2em 0;border:2px solid rgba(0, 0, 0, 0.4);border-radius:0.25em;transition:all 0.2s;opacity:0.4;cursor:pointer}label.svelte-14r7ie4.svelte-14r7ie4:hover{background-color:unset;color:unset}input.svelte-14r7ie4:checked+label.svelte-14r7ie4{color:white;background-color:var(--primary-accent);cursor:unset;opacity:1}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
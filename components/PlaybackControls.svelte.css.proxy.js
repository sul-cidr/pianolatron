// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".pedal-on.svelte-18ab2mh.svelte-18ab2mh{background:yellow}.control.svelte-18ab2mh.svelte-18ab2mh{align-items:center;display:flex;gap:0.5em;padding:0.5em 0}.control.svelte-18ab2mh .svelte-18ab2mh:first-child{width:8em}.control.svelte-18ab2mh input[type=\"range\"]{width:20em}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
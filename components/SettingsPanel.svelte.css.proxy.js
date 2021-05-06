// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div#settings-panel.svelte-war1os{background:var(--background-color);height:100%;left:0;position:absolute;top:0;width:100%}button.svelte-war1os{height:1.5em;width:1.5em;border-radius:1.5em;border:none;margin:0 0.5em}button.active.svelte-war1os{outline:1px solid var(--primary-accent);outline-offset:4px}button.cardinal.svelte-war1os{background:#8c1515}button.blue.svelte-war1os{background:steelblue}button.green.svelte-war1os{background:darkolivegreen}button.grey.svelte-war1os{background:darkslategrey}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
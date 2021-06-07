// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "div#settings-panel.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{background:linear-gradient(var(--background-angle), var(--background-darker) 0%, var(--background-color) 25%, var(--background-color) 75%, var(--background-darker) 100%);background-attachment:fixed;background-position:center;height:100%;left:0;position:absolute;top:0;width:100%}div#settings-panel.svelte-3yrbwy div.svelte-3yrbwy+div.svelte-3yrbwy{margin-top:1em}fieldset.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{margin:2em 0;padding:1em 0.75em}fieldset.svelte-3yrbwy div.svelte-3yrbwy.svelte-3yrbwy{display:flex;justify-content:space-between}legend.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{font-family:serif;font-size:1.4em}button.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{height:1.5em;width:1.5em;border-radius:1.5em;border:none;margin:0 0.5em}button.active.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{outline:1px solid var(--primary-accent);outline-offset:4px}button.cardinal.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{background:#8c1515}button.blue.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{background:steelblue}button.green.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{background:darkolivegreen}button.grey.svelte-3yrbwy.svelte-3yrbwy.svelte-3yrbwy{background:darkslategrey}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
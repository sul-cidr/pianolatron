// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-controls.svelte-maddbr{margin:0 0.5em}button.svelte-maddbr{display:inline-block;padding:0.35em 0.8em;border:0.1em solid #ffffff;margin:0;border-radius:0.25em;color:#ffffff;transition:all 0.2s;background-color:var(--primary-accent)}button.svelte-maddbr:hover,button.pedal-on.svelte-maddbr{color:var(--primary-accent);border-color:var(--primary-accent);background-color:#ffffff}button.pedal-on.svelte-maddbr{background-color:yellow}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
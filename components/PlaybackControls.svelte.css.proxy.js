// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-controls.svelte-1qx6it8.svelte-1qx6it8{margin:0 0.5em}button.svelte-1qx6it8.svelte-1qx6it8{display:inline-block;padding:0.35em 0.8em;border:0.1em solid #ffffff;margin:0;border-radius:0.25em;color:#ffffff;transition:all 0.2s;background-color:var(--primary-accent)}button.svelte-1qx6it8.svelte-1qx6it8:hover,button.pedal-on.svelte-1qx6it8.svelte-1qx6it8{color:var(--primary-accent);border-color:var(--primary-accent);background-color:#ffffff}button.pedal-on.svelte-1qx6it8.svelte-1qx6it8{background-color:yellow}button.svelte-1qx6it8 kbd.svelte-1qx6it8{margin:0 -0.4em 0 0.4em}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
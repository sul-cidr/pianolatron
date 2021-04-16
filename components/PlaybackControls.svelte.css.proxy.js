// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#playback-controls.svelte-kl0s1z{margin:6em 2em 0 2em}.control.svelte-kl0s1z{align-items:center;display:grid;gap:0.5em;padding:0.5em 0;grid:\"title value\" auto \"slider slider\" auto/1fr auto}.control.svelte-kl0s1z input[type=\"range\"]{grid-area:slider;width:100%}button.svelte-kl0s1z{display:inline-block;padding:0.35em 0.8em;border:0.1em solid #ffffff;margin:0;border-radius:0.25em;color:#ffffff;transition:all 0.2s;background-color:#8c1515}button.svelte-kl0s1z:hover,button.pedal-on.svelte-kl0s1z{color:#8c1515;border-color:#8c1515;background-color:#ffffff}button.pedal-on.svelte-kl0s1z{background-color:yellow}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
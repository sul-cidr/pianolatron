// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-1q0dkr7.svelte-1q0dkr7{height:100vh;display:flex;flex-direction:column;overflow:hidden}#app.svelte-1q0dkr7>div.svelte-1q0dkr7:first-child{flex:1 0 auto;position:relative;display:grid;grid-template-rows:1fr;grid-template-columns:auto 1fr auto;grid-template-areas:\"left center right\"}#roll-details{grid-area:left}#roll-details p.svelte-1q0dkr7.svelte-1q0dkr7{opacity:0.5;padding:0.5em 1em}#roll.svelte-1q0dkr7.svelte-1q0dkr7{position:relative;flex:1 0 auto;grid-area:center}#audio-controls{grid-area:right}#keyboard-container.svelte-1q0dkr7.svelte-1q0dkr7{flex:0 1 auto}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
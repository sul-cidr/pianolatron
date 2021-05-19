// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-54l61l.svelte-54l61l{height:100vh;display:flex;flex-direction:column;overflow:hidden}#app.svelte-54l61l>div.svelte-54l61l:first-child{flex:1 0 auto;position:relative;display:grid;grid-template-rows:1fr;grid-template-columns:auto 1fr auto;grid-template-areas:\"left center right\"}#left-sidebar{grid-area:left}#left-sidebar p.svelte-54l61l.svelte-54l61l{opacity:0.5;padding:0.5em 1em}#roll.svelte-54l61l.svelte-54l61l{position:relative;flex:1 0 auto;grid-area:center}#right-sidebar{grid-area:right}#keyboard-container.svelte-54l61l.svelte-54l61l{flex:0 1 auto;user-select:none}#keyboard-overlay.svelte-54l61l.svelte-54l61l{position:absolute;bottom:0;width:100%;opacity:0.5;z-index:5}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
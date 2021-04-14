// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#roll-viewer.svelte-ucgn32{position:relative;height:200px;width:100%}#roll-viewer.svelte-ucgn32::after{background:red;content:\"\";display:block;height:1px;pointer-events:none;position:absolute;top:50%;width:100%}#roll-viewer.svelte-ucgn32 .openseadragon-canvas:focus{outline:none}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
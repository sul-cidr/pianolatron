// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#roll-viewer.svelte-1vutt7g{position:relative;height:100%;width:100%}#roll-viewer.svelte-1vutt7g::before{background:#8c1515;content:\"\";display:block;height:1px;pointer-events:none;position:absolute;top:50%;width:100%;z-index:3}#roll-viewer.svelte-1vutt7g::after{background-color:#dad7cb;bottom:0;content:\" \";left:0;mix-blend-mode:multiply;pointer-events:none;position:absolute;right:0;top:0}#roll-viewer.svelte-1vutt7g canvas{background:white !important}#roll-viewer.svelte-1vutt7g .openseadragon-canvas:focus{outline:none}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
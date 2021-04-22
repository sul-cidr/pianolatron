// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#roll-viewer.svelte-a5m2iq{position:relative;height:100%;width:100%}#roll-viewer.svelte-a5m2iq::before{background:#8c1515;content:\"\";display:block;height:1px;pointer-events:none;position:absolute;top:50%;width:100%;z-index:3}#roll-viewer.svelte-a5m2iq::after{background-color:#dad7cb;bottom:0;content:\" \";left:0;mix-blend-mode:multiply;pointer-events:none;position:absolute;right:0;top:0}#roll-viewer.svelte-a5m2iq canvas{background:white !important}#roll-viewer.svelte-a5m2iq .openseadragon-canvas:focus{outline:none}#roll-viewer.svelte-a5m2iq mark{animation:svelte-a5m2iq-mark-recede 0.5s ease-in-out;background-color:yellow;box-shadow:0 0 5px yellow;mix-blend-mode:multiply}#roll-viewer.svelte-a5m2iq mark:hover{background-color:transparent;box-shadow:none;mix-blend-mode:normal;outline:6px solid darkturquoise;outline-offset:8px;z-index:4}#roll-viewer.svelte-a5m2iq mark:hover[data-info]::after{background-color:darkturquoise;color:white;content:attr(data-info);display:block;font-weight:bold;left:calc( 100% + 8px + 6px );padding:8px 10px 8px 4px;position:absolute;text-shadow:0px 0px 8px black;top:-14px}@keyframes svelte-a5m2iq-mark-recede{from{border-radius:30%;mix-blend-mode:normal}}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
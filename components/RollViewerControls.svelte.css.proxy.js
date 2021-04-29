// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#roll-viewer-controls.svelte-10hyfa4.svelte-10hyfa4{background:rgba(0, 0, 0, 0.4);border-radius:4px;left:50%;padding:8px;position:absolute;top:8px;transform:translateX(-50%);z-index:25}#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4{background:none;border:none;color:#ffffff;cursor:pointer;margin:0;padding:0.35em 0.8em;transition:all 0.2s}#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4:focus,#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4:active{outline:0}#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4:hover{outline:1px solid white}#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4:active{color:grey}#roll-viewer-controls.svelte-10hyfa4 button.svelte-10hyfa4:disabled{color:grey;cursor:not-allowed}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
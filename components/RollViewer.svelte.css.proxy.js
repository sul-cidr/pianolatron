// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#roll-viewer.svelte-aepdni.svelte-aepdni{position:relative;height:100%;width:100%}#roll-viewer.svelte-aepdni p.svelte-aepdni{background:rgba(0, 0, 0, 0.4);border-radius:4px;color:white;left:1em;padding:4px 8px;position:absolute;top:1em;z-index:1}#roll-viewer.svelte-aepdni.svelte-aepdni::before{background-color:var(--primary-accent-semiopaque);border:1px solid var(--primary-accent);content:\"\";display:block;height:var(--trackerbar-height);pointer-events:none;position:absolute;top:50%;width:calc(100% - var(--navigator-width));z-index:1}#roll-viewer.svelte-aepdni.svelte-aepdni::after{background:linear-gradient(var(--background-angle), var(--background-darker) 0%, var(--background-color) 25%, var(--background-color) 75%, var(--background-darker) 100%);background-attachment:fixed;background-position:center;bottom:0;content:\" \";left:0;mix-blend-mode:multiply;pointer-events:none;position:absolute;right:0;top:0}#roll-viewer.svelte-aepdni canvas{background:white !important}#roll-viewer.svelte-aepdni .openseadragon-canvas:focus{outline:none}#roll-viewer.svelte-aepdni .displayregion::after{content:attr(data-label);display:block;position:absolute;width:100%;font-size:16px;text-align:center;padding:8px 0;background:linear-gradient(180deg, transparent 0%, white 20%, white 80%, transparent 100%);top:calc(100% + 2px);transition:margin 0.5s ease}#roll-viewer.svelte-aepdni .displayregion.label-above::after{margin-top:-100%;top:0}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
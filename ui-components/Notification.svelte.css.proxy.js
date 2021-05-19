// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".notification.svelte-l557pn.svelte-l557pn{border-radius:4px;box-shadow:0 3px 6px rgba(0, 0, 0, 0.3);display:flex;justify-content:space-between;left:50%;min-width:400px;position:absolute;top:20%;transform:translate(-50%);z-index:8}.notification.error.svelte-l557pn.svelte-l557pn{background:#ff4848;border:1px solid #eb0f0f;border-left-width:6px;color:white}.notification.error.svelte-l557pn .close.svelte-l557pn{color:white;border-left-color:rgba(255, 255, 255, 0.5)}section.svelte-l557pn.svelte-l557pn{display:flex;flex-direction:column;padding:0.75em 0.5em;width:100%}header.svelte-l557pn.svelte-l557pn{font-size:1.25em;font-weight:bold;padding:0 0.25em 0.25em;margin-bottom:0.5em}p.svelte-l557pn.svelte-l557pn{margin:0;padding:0.25em}.close.svelte-l557pn.svelte-l557pn{align-items:center;border-left:1px solid rgba(0, 0, 0, 0.2);cursor:pointer;display:flex;font-weight:bold;padding:0 6px}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
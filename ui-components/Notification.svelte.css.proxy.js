// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".notification.svelte-1wupy6u.svelte-1wupy6u{border-radius:4px;box-shadow:0 3px 6px rgba(0, 0, 0, 0.3);display:flex;justify-content:space-between;left:50%;min-width:400px;position:absolute;top:20%;transform:translate(-50%);z-index:7}.notification.error.svelte-1wupy6u.svelte-1wupy6u{background:#ff4848;border:1px solid #eb0f0f;border-left-width:6px;color:white}.notification.error.svelte-1wupy6u .close.svelte-1wupy6u{color:white;border-left-color:rgba(255, 255, 255, 0.5)}section.svelte-1wupy6u.svelte-1wupy6u{display:flex;flex-direction:column;padding:0.75em 0.5em;width:100%}header.svelte-1wupy6u.svelte-1wupy6u{font-size:1.25em;font-weight:bold;padding:0 0.25em 0.25em;margin-bottom:0.5em}p.svelte-1wupy6u.svelte-1wupy6u{margin:0;padding:0.25em}.close.svelte-1wupy6u.svelte-1wupy6u{align-items:center;border-left:1px solid rgba(0, 0, 0, 0.2);cursor:pointer;display:flex;font-weight:bold;padding:0 6px}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
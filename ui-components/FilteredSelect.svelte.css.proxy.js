// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".filtered-select.svelte-18jy66v{height:2.25em;position:relative;width:100%}.filtered-select.svelte-18jy66v::after{border:3px solid var(--primary-accent);border-right:0;border-top:0;border-radius:2px;content:\" \";display:block;height:0.625em;margin-top:-0.4375em;pointer-events:none;position:absolute;right:1.125em;top:50%;transform:rotate(-45deg);transform-origin:center;width:0.625em}span.input.svelte-18jy66v{background:white;cursor:pointer;display:inline-block;height:100%;line-height:calc(2.25em - 10px);overflow:hidden;padding:5px 2.5em 5px 11px;text-overflow:ellipsis;white-space:nowrap;width:100%}ul.svelte-18jy66v{background:#fff;border:1px solid #999;display:none;margin:0;max-height:calc(15 * (1rem + 10px) + 15px);min-width:100%;overflow-y:auto;padding:10px 0;position:relative;top:0px;user-select:none;width:max-content;z-index:99}ul.open.svelte-18jy66v{display:block}li.svelte-18jy66v{color:#333;cursor:pointer;line-height:1;padding:5px 15px;white-space:nowrap;width:100%}li.selected.svelte-18jy66v{background-color:var(--primary-accent);color:#fff}li.selected.svelte-18jy66v mark{color:#fff}li.svelte-18jy66v mark{background-color:unset;color:green;font-weight:700}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
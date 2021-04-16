// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#keyboard.svelte-b6m1um.svelte-b6m1um.svelte-b6m1um{display:flow-root;margin:1em auto;position:relative;width:fit-content}div#keys.svelte-b6m1um.svelte-b6m1um.svelte-b6m1um{display:block;height:calc(1.8vw * 6);margin-top:12px;padding:0;width:100%}div#keys.svelte-b6m1um.svelte-b6m1um.svelte-b6m1um::before{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAYAAADeM14FAAAAd0lEQVQYV0WMPQoDIRQGv1dZKFjIWjyst1i23sOlyQFShNQ5nZVg7Q+CaDApMuUwDL3Oc+acoZQCEYGex/EVvXdIKUHv65ree2itUUoBPfZ91lqxEEKA7szTOYcY4++zHq01GGOwSrpt22RmhBD+xRgDKSVYa/EBmDYy7EuYDVgAAAAASUVORK5CYII=);content:\"\";position:absolute;top:0;height:12px;left:-4px;right:-4px;box-shadow:0 1px 3px rgba(0, 0, 0, 0.7), 1px 0px 3px rgba(0, 0, 0, 0.7), -1px 0px 3px rgba(0, 0, 0, 0.7);z-index:3}div#keys.svelte-b6m1um div.svelte-b6m1um.svelte-b6m1um{float:left;position:relative;width:1.8vw}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:first-child{background:linear-gradient(-30deg, #f5f5f5, #fff);border-radius:0 0 3px 3px;border:1px solid #ccc;box-shadow:inset 0 1px 0px #fff, inset 0 -1px 0px #fff, inset 1px 0px 0px #fff, inset -1px 0px 0px #fff, 0 4px 3px rgba(0, 0, 0, 0.7);display:block;height:calc(1.8vw * 6 - 20px)}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:first-child:active,div#keys.svelte-b6m1um div.svelte-b6m1um :first-child.depressed{box-shadow:0 2px 2px rgba(0, 0, 0, 0.4);height:calc(1.8vw * 6 - 24px);position:relative;top:2px}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:first-child:active:before,div#keys.svelte-b6m1um div.svelte-b6m1um :first-child.depressed:before{border-color:transparent transparent transparent rgba(0, 0, 0, 0.1);border-style:solid;border-width:calc(1.8vw * 6 - 24px) 5px 0px;content:\"\";height:0px;left:0px;position:absolute;top:0px;width:0px}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:first-child:active:after,div#keys.svelte-b6m1um div.svelte-b6m1um :first-child.depressed:after{border-color:transparent rgba(0, 0, 0, 0.1) transparent transparent;border-style:solid;border-width:calc(1.8vw * 6 - 24px) 5px 0px;content:\"\";height:0px;position:absolute;right:0px;top:0px;width:0px}div#keys.svelte-b6m1um div.svelte-b6m1um :first-child.depressed{background:#b5e2ff}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:nth-child(2){background:linear-gradient(-20deg, #333, #000, #333);border-color:#666 #222 #111 #555;border-radius:0 0 2px 2px;border-style:solid;border-width:1px 2px 7px;box-shadow:inset 0px -1px 2px rgba(255, 255, 255, 0.4), 0 2px 3px rgba(0, 0, 0, 0.4);height:calc(1.8vw * 3);left:calc(1.8vw - 2px - 0.45vw);position:absolute;top:0px;width:0.9vw;z-index:10}div#keys.svelte-b6m1um div.svelte-b6m1um .svelte-b6m1um:nth-child(2):active,div#keys.svelte-b6m1um div.svelte-b6m1um :nth-child(2).depressed{border-bottom-width:2px;box-shadow:inset 0px -1px 1px rgba(255, 255, 255, 0.4), 0 1px 0px rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4), 0 -1px 0px #000;height:calc(1.8vw * 3 + 3px)}div#keys.svelte-b6m1um div.svelte-b6m1um :nth-child(2).depressed{background:#b5e2ff}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
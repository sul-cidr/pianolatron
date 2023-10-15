<style>
    .copy-button {
        outline: none;
        border: none;
        background: none;
        color: inherit;
        font-family: inherit;
        font-size: 14px;
        transition: all 120ms ease-out;
    }
    .copy-button svg {
        width: 14px;
        height: 14px;
    }
</style>

<script>
    import { playbackProgress, playbackProgressEnd } from "../stores";
    export let withProgress = false;
    export let linkText = "Copy URL";
    export let copiedText = "Copied";
    let copied = false;

    const copy = () => {
        const urlToCopy = new URL(window.location);
        if ( withProgress ) {
            const start = ($playbackProgress * 100).toFixed(2);
            const end = ($playbackProgressEnd * 100).toFixed(2);
            const params = Object.fromEntries(new URLSearchParams(urlToCopy.search));
            urlToCopy.search = new URLSearchParams({...params, start, end});
        }
        window.navigator.clipboard.writeText(urlToCopy.toString()); 
        copied = true;
        setTimeout(function () {
            copied = false;
        }, 1000);
    }

</script>

<button
  on:click="{copy}"
  class="{$$props.class} copy-button"
>
    {#if !copied}
        <svg viewBox="0 0 16 14" aria-hidden="true"><path
            fill-rule="evenodd"
            d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"
        ></path></svg>
         <span>{linkText}</span>
    {:else}
        <svg
        viewBox="0 0 512 512"
        style="enable-background:new 0 0 512 512;"
        xml:space="preserve"
        >
        <path
            d="M504.502,75.496c-9.997-9.998-26.205-9.998-36.204,0L161.594,382.203L43.702,264.311c-9.997-9.998-26.205-9.997-36.204,0
            c-9.998,9.997-9.998,26.205,0,36.203l135.994,135.992c9.994,9.997,26.214,9.99,36.204,0L504.502,111.7
            C514.5,101.703,514.499,85.494,504.502,75.496z"
        ></path>
        </svg>
        <span>{copiedText}</span>
    {/if}
</button>
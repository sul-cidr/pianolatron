<script>
  import { fade } from "svelte/transition";

  export let showLoadingSpinner;
  export let loadingSpinnerText = "Loading resources...";
</script>

{#if showLoadingSpinner}
  <div id="loading" transition:fade>
    <div>
      <span />&nbsp;
      <span />&nbsp;
      <span />&nbsp;
      <span />&nbsp;
      <span />
    </div>
    {loadingSpinnerText}
  </div>
{/if}

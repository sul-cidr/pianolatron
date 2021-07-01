<style>
  div {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow: hidden;
    position: relative;
  }
</style>

<script>
  import PanelSwitcher from "./PanelSwitcher.svelte";
  import PlaybackControls from "./PlaybackControls.svelte";
  import BasicSettings from "./BasicSettings.svelte";
  import AdvancedSettings from "./AdvancedSettings.svelte";

  export let playPauseApp;
  export let skipToPercentage;
  export let stopApp;

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel />
<div>
  <BasicSettings {skipToPercentage} />
  {#if selectedPanel === "settings"}
    <AdvancedSettings />
  {/if}
</div>
<PlaybackControls {playPauseApp} {stopApp} />

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
  import PlaybackSettings from "./PlaybackSettings.svelte";
  import VisualizationSettings from "./VisualizationSettings.svelte";

  export let playPauseApp;
  export let skipToPercentage;
  export let stopApp;

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel />
<div>
  <PlaybackSettings {skipToPercentage} />
  {#if selectedPanel === 'settings'}
    <VisualizationSettings />
  {/if}
</div>
<PlaybackControls {playPauseApp} {stopApp} />

<style>
  div {
    position: relative;
    margin-top: 1em;
  }
</style>

<script>
  import PlaybackSettings from "./PlaybackSettings.svelte";
  import SettingsPanel from "./SettingsPanel.svelte";
  import PanelSwitcher from "./PanelSwitcher.svelte";

  export let playPauseApp;
  export let stopApp;
  export let skipToPercentage;

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel />
<div>
  <PlaybackSettings {playPauseApp} {stopApp} {skipToPercentage} />
  {#if selectedPanel === 'settings'}
    <SettingsPanel />
  {/if}
</div>

<style>
  div {
    position: relative;
    margin-top: 1em;
  }
</style>

<script>
  import PlaybackSettings from "./PlaybackSettings.svelte";
  import PlaybackControls from "./PlaybackControls.svelte";
  import SettingsPanel from "./SettingsPanel.svelte";
  import PanelSwitcher from "./PanelSwitcher.svelte";

  export let playPauseApp;
  export let stopApp;
  export let skipToPercentage;

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel />
<div>
  <PlaybackSettings {skipToPercentage} />
  {#if selectedPanel === 'settings'}
    <SettingsPanel />
  {/if}
</div>
<PlaybackControls {playPauseApp} {stopApp} />

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
  import AudioSettings from "./AudioSettings.svelte";

  export let playPauseApp;
  export let skipToPercentage;
  export let stopApp;

  const panels = {
    controls: {
      component: BasicSettings,
      props: { skipToPercentage },
    },
    settings: { component: AdvancedSettings },
    audio: { component: AudioSettings },
  };

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel />
<div>
  <svelte:component
    this={panels[selectedPanel].component}
    {...panels[selectedPanel].props}
  />
</div>
<PlaybackControls {playPauseApp} {stopApp} />

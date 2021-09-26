<style lang="scss">
  div {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow: hidden;
    position: relative;

    :global(> div) {
      @include background;
      display: flex;
      flex-direction: column;
      gap: 4%;
      height: 100%;
      left: 0;
      overflow-y: auto;
      position: absolute;
      top: 0;
      width: 100%;
    }

    :global(.setting + .setting) {
      margin-top: 1em;
    }

    :global(fieldset) {
      padding: 1em 0.75em;
    }

    :global(legend) {
      font-family: $primary-typeface;
      font-size: 1.4em;
    }

    :global(fieldset div) {
      display: flex;
      justify-content: space-between;
    }

    :global(.control) {
      align-items: center;
      display: grid;
      gap: 0.5em;
      padding: 0 0.5em 0.5em;
      grid:
        "title value" auto
        "slider slider" auto / 1fr auto;
    }

    :global(.control input[type="range"]) {
      grid-area: slider;
      width: 100%;
    }
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

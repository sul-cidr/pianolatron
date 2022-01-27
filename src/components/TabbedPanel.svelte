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
      border-color: rgba(white, 0.8);
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
  }
</style>

<script>
  import PanelSwitcher from "./PanelSwitcher.svelte";
  import PlaybackControls from "./PlaybackControls.svelte";
  import BasicSettings from "./BasicSettings.svelte";
  import AdvancedSettings from "./AdvancedSettings.svelte";
  import AudioSettings from "./AudioSettings.svelte";
  import MidiSettings from "./MidiSettings.svelte";

  export let playPauseApp;
  export let skipToPercentage;
  export let stopApp;
  export let recordingControl;

  const panels = {
    controls: {
      component: BasicSettings,
      props: { skipToPercentage },
      icon: "sliders",
    },
    settings: { component: AdvancedSettings, icon: "cog" },
    audio: { component: AudioSettings, icon: "piano" },
    midi: {
      component: MidiSettings,
      props: { recordingControl },
      icon: "midi",
    },
  };

  let selectedPanel = "controls";
</script>

<PanelSwitcher bind:selectedPanel {panels} />
<div>
  <svelte:component
    this={panels[selectedPanel].component}
    {...panels[selectedPanel].props}
  />
</div>
<PlaybackControls {playPauseApp} {stopApp} />

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

    :global(fieldset div),
    :global(fieldset label) {
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
  import ViewerMetrics from "./ViewerMetrics.svelte";
  import ExpressionSettings from "./ExpressionSettings.svelte";

  export let reloadRoll;
  export let exportInAppMIDI;

  const panels = {
    controls: {
      component: BasicSettings,
      icon: "sliders",
      title: "Performance controls",
    },
    settings: {
      component: AdvancedSettings,
      icon: "cog",
      title: "Advanced settings",
    },
    audio: { component: AudioSettings, icon: "piano", title: "Audio settings" },
    midi: {
      component: MidiSettings,
      icon: "midi",
      title: "MIDI settings",
    },
    expression: {
      component: ExpressionSettings,
      props: { reloadRoll, exportInAppMIDI },
      icon: "exp_curves",
      title: "Expression settings",
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
<ViewerMetrics />
<PlaybackControls />

<style lang="scss">
  .flex-collapsible {
    transition: all 0.3s ease;

    > div {
      bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      overflow: visible;
      padding: 0.5em;
      position: absolute;
      top: 0;
      height: 100%;

      &:hover > .panel-show-hide-button {
        opacity: 1;
      }
    }
  }

  .panel-show-hide-button {
    position: absolute;
    top: 40%;
    padding: 0;
    z-index: z($main-context, sidebar-collapse-labels);

    &.left {
      &:not(.hidden) {
        right: 0;
        opacity: 0;
      }
      border-radius: 4px 0 0 4px;
      &.hidden {
        left: 0;
        border-radius: 0 4px 4px 0;
      }
    }
    &.right {
      &:not(.hidden) {
        left: 0;
        opacity: 0;
      }
      border-radius: 0 4px 4px 0;
      &.hidden {
        right: 100%;
        border-radius: 4px 0 0 4px;
      }
    }

    &.hidden {
      visibility: visible;
    }

    &:hover,
    &:focus-within {
      opacity: 1;
    }
  }
</style>

<script>
  import IconButton from "../ui-components/IconButton.svelte";

  export let id;
  export let width;
  export let position = "right";
  export let hidden = false;

  let iconName = `panel-${position}-${hidden ? "open" : "collapse"}`;

  const togglePanel = () => {
    hidden = !hidden;
    iconName = `panel-${position}-${hidden ? "open" : "collapse"}`;
  };
</script>

<div
  {id}
  class={`flex-collapsible ${position}`}
  style={`width: ${hidden ? 0 : width};`}
>
  <div style={`width: ${width}; visibility: ${hidden ? "hidden" : "visible"}`}>
    <slot />
    <div
      class={`overlay-buttons panel-show-hide-button ${position}`}
      class:hidden
    >
      {#key iconName}
        <IconButton
          class="always-visible"
          on:click={togglePanel}
          {iconName}
          label="Show/Hide Panel"
          height="32"
          width="32"
        />
      {/key}
    </div>
  </div>
</div>

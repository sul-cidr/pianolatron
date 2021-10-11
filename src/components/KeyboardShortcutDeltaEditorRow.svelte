<style lang="scss">
  dd {
    span {
      width: 4ch;
      text-align: right;
    }

    :global(input[type="range"]) {
      height: 100%;
      margin: 0 1em;
      width: 7em;
    }
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    margin: 0;
    padding: 0;

    :global(svg) {
      stroke: grey;
    }

    &:not([disabled]):hover :global(svg) {
      stroke: black;
    }

    &[disabled] {
      cursor: default;
      opacity: 0.5;
    }
  }
</style>

<script>
  import { createEventDispatcher } from "svelte";
  import Icon from "../ui-components/Icon.svelte";
  import RangeSlider from "../ui-components/RangeSlider.svelte";
  import { tooltip } from "../lib/tooltip-action";

  export let shortcut;
  export let meta;
  export let controlConfigValue;
  export let isChanged;

  const dispatch = createEventDispatcher();
  const updateDelta = () => dispatch("update", controlConfigValue);
  const resetShortcut = () => dispatch("reset");
</script>

<dt use:tooltip={meta.help}>{meta.description}</dt>
<dd>
  ±<span>{controlConfigValue}</span>
  <RangeSlider
    bind:value={controlConfigValue}
    min="0"
    max="1"
    step="0.01"
    name={shortcut}
    on:input={updateDelta}
  />

  {#key isChanged}
    <button
      use:tooltip={isChanged ? "Reset to Default" : undefined}
      disabled={!isChanged}
      on:click={resetShortcut}
    >
      <Icon name="reset" height="20" width="20" />
    </button>
  {/key}
</dd>

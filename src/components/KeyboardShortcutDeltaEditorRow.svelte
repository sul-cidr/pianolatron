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
</style>

<script>
  import { createEventDispatcher } from "svelte";
  import IconButton from "../ui-components/IconButton.svelte";
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

<dt use:tooltip={meta.help}>{meta.description}:</dt>
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
    <IconButton
      iconName="reset"
      label="Reset Increment to Default"
      height="20"
      width="20"
      disabled={!isChanged}
      tooltip={isChanged ? "Reset to Default" : undefined}
      on:click={resetShortcut}
    />
  {/key}
</dd>

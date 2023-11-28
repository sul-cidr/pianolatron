<style>
  div {
    display: flex;
    min-height: 3.5em;
    justify-content: space-between;
    padding: 0 0.5em 0.5em;
    position: relative;
  }

  div :global(input[type="range"]) {
    left: 0;
    margin: 0;
    padding: 2em 0 1em 0;
    position: absolute;
    top: 0;
  }
</style>

<script>
  import RangeSlider from "./RangeSlider.svelte";

  export let value;
  export let min;
  export let max;
  export let step;
  export let name;
  export let mousewheel = true;
</script>

<div>
  <label for={name}><slot name="label">{name}</slot></label>
  <span><slot name="value">{value}</slot></span>
  <RangeSlider
    bind:value
    {min}
    {max}
    {step}
    {name}
    {mousewheel}
    on:input
    on:change
  />
</div>

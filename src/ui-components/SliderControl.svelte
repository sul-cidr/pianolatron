<style>
  div {
    display: flex;
    height: 3.5em;
    justify-content: space-between;
    padding: 0 0.5em 0.5em;
    position: relative;
  }

  div :global(input[type="range"]) {
    left: 0;
    margin: 0;
    padding: 2.5em 0 1em 0;
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

  const clamp = (_value) => Math.min(Math.max(_value, min), max);

  const handleWheel = ({ deltaY }) => {
    if (!mousewheel) return;
    const precision = (step.toString().split(".")[1] || "").length;
    if (deltaY > 0) {
      value = clamp((Number(value) + Number(step)).toFixed(precision));
    } else {
      value = clamp((Number(value) - Number(step)).toFixed(precision));
    }
  };
</script>

<div on:mousewheel={handleWheel}>
  <span><slot name="label">{name}</slot></span>
  <span><slot name="value">{value}</slot></span>
  <RangeSlider bind:value on:input on:change {min} {max} {step} {name} />
</div>

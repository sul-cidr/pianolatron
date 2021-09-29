<style>
  div {
    align-items: center;
    display: grid;
    gap: 0.5em;
    padding: 0 0.5em 0.5em;
    grid:
      "title value" auto
      "slider slider" auto / 1fr auto;
  }

  :global(input[type="range"]) {
    grid-area: slider;
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

<style lang="scss">
  div {
    background-color: rgba(white, 0.5);
    color: black;
    font-size: 12px;
    height: 22px;
    transition: width 0.5s ease;
    position: absolute;
    left: 1em;
    top: 1em;
    z-index: 1;
    display: flex;
    border: 1px solid black;
    border-top: 0;
    border-right: 0;

    &:before {
      content: attr(data-label);
      display: block;
      right: 4px;
      position: absolute;
      top: calc(100% + 2px);
    }
  }

  span {
    background-repeat: no-repeat;
    border-radius: 0;
    flex: 1 0 auto;
  }

  .us span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 50% bottom, 100% bottom;
    background-size: 1px 12px, 1px 22px;
  }

  .us.major span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 25% bottom, 50% bottom, 75% bottom, 100% bottom;
    background-size: 1px 9px, 1px 12px, 1px 9px, 1px 22px;
  }

  .us.minor span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 12.5% bottom, 25% bottom, 37.5% bottom, 50% bottom,
      62.5% bottom, 75% bottom, 87.5% bottom, 100% bottom;
    background-size: 1px 6px, 1px 9px, 1px 6px, 1px 12px, 1px 6px, 1px 9px,
      1px 6px, 1px 22px;
  }
</style>

<script>
  import { fade } from "svelte/transition";

  export let ppi;

  const minScaleBarWidth = 100;

  let multiples;
  let width;

  const calculateMultiples = () => {
    multiples = 1;
    while (ppi * multiples < minScaleBarWidth) multiples += 1;
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: ppi, calculateMultiples();
  $: width = ppi * multiples;
</script>

<div
  transition:fade
  class="us"
  class:major={multiples < 5}
  class:minor={multiples < 3}
  style={`width: ${width}px`}
  data-label={`${multiples}in`}
>
  {#each Array(multiples) as _}<span />{/each}
</div>

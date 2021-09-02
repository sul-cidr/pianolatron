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
      background: rgba(white, 0.5);
      content: attr(data-label);
      display: block;
      padding: 1px 4px;
      position: absolute;
      right: 1px;
      top: calc(100% + 4px);
    }
  }

  span {
    background-repeat: no-repeat;
    border-radius: 0;
    flex: 1 0 auto;
  }

  .us span {
    background-image: linear-gradient(black, black);
    background-position: 100% bottom;
    background-size: 1px 22px;
  }

  .us.halves span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 50% bottom, 100% bottom;
    background-size: 1px 16px, 1px 22px;
  }

  .us.quarters span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 25% bottom, 50% bottom, 75% bottom, 100% bottom;
    background-size: 1px 12px, 1px 16px, 1px 12px, 1px 22px;
  }

  .us.eighths span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 12.5% bottom, 25% bottom, 37.5% bottom, 50% bottom,
      62.5% bottom, 75% bottom, 87.5% bottom, 100% bottom;
    background-size: 1px 8px, 1px 12px, 1px 8px, 1px 16px, 1px 8px, 1px 12px,
      1px 8px, 1px 22px;
  }

  .us.sixteenths span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 6.25% bottom, 12.5% bottom, 18.75% bottom, 25% bottom,
      31.25% bottom, 37.5% bottom, 43.75% bottom, 50% bottom, 56.25% bottom,
      62.5% bottom, 68.75% bottom, 75% bottom, 81.25% bottom, 87.5% bottom,
      93.75% bottom, 100% bottom;
    background-size: 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
      1px 4px, 1px 16px, 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
      1px 4px, 1px 22px;
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
  class:halves={multiples < 9}
  class:quarters={multiples < 5}
  class:eighths={multiples < 3}
  class:sixteenths={multiples === 1}
  style={`width: ${width}px`}
  data-label={`${multiples}in`}
>
  {#each Array(multiples) as _}<span />{/each}
</div>

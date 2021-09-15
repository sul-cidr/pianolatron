<style lang="scss">
  div {
    background-color: rgba(white, 0.5);
    color: black;
    font-size: 12px;
    height: 28px;
    transition: width 0.5s ease, transform 0.5s ease;
    position: absolute;
    left: 1em;
    top: 1em;
    z-index: 1;
    display: flex;
    border: 1px solid black;
    border-bottom: 0;
    border-right: 0;
    transform-origin: top left;

    &::before {
      background: rgba(white, 0.5);
      content: attr(data-label);
      display: block;
      padding: 1px 4px;
      position: absolute;
      right: 1px;
      top: calc(100% + 4px);
    }

    &.vertical {
      transform: rotate(-90deg) translate(-100%);

      &::before {
        right: 0;
        top: 0;
        transform: rotate(-270deg) translate(100%);
      }

      span::before {
        transform: rotate(-270deg);
      }
    }
  }

  span {
    background-repeat: no-repeat;
    border-radius: 0;
    flex: 1 0 auto;
    position: relative;

    &::before {
      bottom: -2px;
      content: attr(data-label);
      display: none;
      position: absolute;
    }
  }

  .us span {
    background-image: linear-gradient(black, black);
    background-position: 100% top;
    background-size: 1px 16px;

    &:last-child {
      background-size: 1px 100%;
    }

    &:nth-child(even)::before {
      display: block;
      right: 1px;
    }
  }

  .us.halves span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 50% top, 100% top;
    background-size: 1px 12px, 1px 22px;

    &:last-child {
      background-size: 1px 12px, 1px 100%;
    }

    &::before {
      display: block;
      right: 4px;
    }
  }

  .us.quarters span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 25% top, 50% top, 75% top, 100% top;
    background-size: 1px 12px, 1px 16px, 1px 12px, 1px 22px;

    &:last-child {
      background-size: 1px 12px, 1px 16px, 1px 12px, 1px 100%;
    }

    &::before {
      display: block;
      right: 4px;
    }
  }

  .us.eighths span {
    background-image: linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black), linear-gradient(black, black),
      linear-gradient(black, black);
    background-position: 12.5% top, 25% top, 37.5% top, 50% top, 62.5% top,
      75% top, 87.5% top, 100% top;
    background-size: 1px 8px, 1px 12px, 1px 8px, 1px 16px, 1px 8px, 1px 12px,
      1px 8px, 1px 22px;

    &:last-child {
      background-size: 1px 8px, 1px 12px, 1px 8px, 1px 16px, 1px 8px, 1px 12px,
        1px 8px, 1px 100%;
    }

    &::before {
      display: block;
      right: 4px;
    }
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
    background-position: 6.25% top, 12.5% top, 18.75% top, 25% top, 31.25% top,
      37.5% top, 43.75% top, 50% top, 56.25% top, 62.5% top, 68.75% top, 75% top,
      81.25% top, 87.5% top, 93.75% top, 100% top;
    background-size: 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
      1px 4px, 1px 16px, 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
      1px 4px, 1px 22px;

    &:last-child {
      background-size: 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
        1px 4px, 1px 16px, 1px 4px, 1px 8px, 1px 4px, 1px 12px, 1px 4px, 1px 8px,
        1px 4px, 1px 100%;
    }

    &::before {
      display: block;
      right: 4px;
    }
  }

  button {
    background: rgba(white, 0.5);
    border-radius: 4px;
    border: none;
    cursor: pointer;
    position: absolute;
    top: calc(100% + 4px);
  }
</style>

<script>
  import { fade } from "svelte/transition";
  import { draggable } from "../lib/draggable-action";

  export let ppi;

  const minScaleBarWidth = 100;
  const maxMultiples = 12;

  let multiples;
  let ref;
  let vertical = false;

  const calculateMultiples = () => {
    multiples = 1;
    while (ppi * multiples < minScaleBarWidth && multiples < maxMultiples)
      multiples += 1;
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: ppi, calculateMultiples();
  $: if (ref) ref.style.width = `${ppi * multiples}px`;
</script>

<div
  transition:fade
  use:draggable={/* corral = */ true}
  bind:this={ref}
  class="us"
  class:vertical
  class:halves={multiples < 9}
  class:quarters={multiples < 5}
  class:eighths={multiples < 3}
  class:sixteenths={multiples === 1}
  data-label="inches"
>
  {#each Array(multiples) as _, i}<span data-label={i + 1} />{/each}
  <button on:click={() => (vertical = !vertical)}>⟳</button>
</div>

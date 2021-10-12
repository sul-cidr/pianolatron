<style lang="scss">
  $aspect-ratio: 2.848;
  $container-height: 40vh;
  $container-width: 80vw;

  #loading {
    background-color: rgba(white, 0.6);
    color: var(--primary-accent);
    font-size: 1.4em;
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    text-align: center;
    text-shadow: 0px 0px 8px white;
    top: 0;
    width: 100%;
    z-index: 9;

    > div {
      height: $container-height;
      margin: max(15%, 100px) auto 10px;
      overflow: hidden;
      position: relative;
      width: $container-width;

      > div {
        animation: scroll 10s linear infinite;
        background-color: var(--primary-accent-semiopaque);
        height: calc(
          (#{$container-width} * #{$aspect-ratio}) + #{$container-height}
        );
        left: 0;
        mask: url(/loader.svg) 0 0 / 100% repeat-y;
        position: absolute;
        top: 0;
        transform: translate3d(0, 0, 0);
        width: 100%;
      }
    }

    &:global(.fade-out) {
      opacity: 0;
      transition: opacity 2s ease;
    }
  }

  @keyframes scroll {
    100% {
      transform: translateY(calc(#{$container-width} * #{$aspect-ratio} * -1));
    }
  }

  span {
    position: absolute;
    display: block;
    top: 40vh;
    left: 50%;
    transform: translate(-50%);
    text-shadow: 0px 0px 8px white;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 1em;
    padding: 1em 3em;
  }
</style>

<script>
  import { fade } from "svelte/transition";

  export let showLoadingSpinner;
  export let loadingSpinnerText = "Loading resources...";
</script>

{#if showLoadingSpinner}
  <div id="loading" transition:fade>
    <div><div /></div>
    <span>{loadingSpinnerText}</span>
  </div>
{/if}

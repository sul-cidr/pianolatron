<style lang="scss">
  $aspect-ratio: 2.848;
  $container-height: 20vh;
  $container-width: unquote("min(800px, 80vw)");

  #loading {
    background-color: rgba(white, 0.2);
    color: var(--primary-accent);
    display: grid;
    font-size: 1.4em;
    height: 100%;
    left: 0;
    place-content: center;
    pointer-events: none;
    position: absolute;
    text-align: center;
    text-shadow: 0px 0px 8px white;
    top: 0;
    width: 100%;
    z-index: 9;

    > div {
      background-color: rgba(white, 0.6);
      border-radius: 0.5em;
      box-shadow: 0 0 10px white;
      display: flex;
      flex-direction: column;
      gap: 1em;
      padding: 1em;
      transform: translate3d(0, -50%, 0);
      width: $container-width;

      > div {
        height: $container-height;
        overflow: hidden;
        position: relative;

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
    }

    &:global(.fade-out) {
      opacity: 0;
      transition: opacity 1s ease;
    }
  }

  @keyframes scroll {
    100% {
      transform: translateY(calc(#{$container-width} * #{$aspect-ratio} * -1));
    }
  }

  span {
    display: grid;
    place-items: center;
    text-shadow: 0px 0px 8px white;

    &.sub-text {
      opacity: 0;
      max-height: 0;
      animation: expandText 1s ease-in forwards;
      animation-delay: 5s;
      overflow: hidden;
    }

    @keyframes expandText {
      0% {
        max-height: 0;
        opacity: 0;
      }
      100% {
        max-height: 1.5em;
        opacity: 1;
      }
    }
  }
</style>

<script>
  import { fade } from "svelte/transition";

  export let showLoadingSpinner;
  export let loadingSpinnerText = "Loading resources...";
</script>

{#if showLoadingSpinner}
  <div id="loading" transition:fade>
    <div>
      <div><div /></div>
      <span>{loadingSpinnerText}</span>
      <span class="sub-text"
        >If this message persists, please try reloading the page.</span
      >
    </div>
  </div>
{/if}

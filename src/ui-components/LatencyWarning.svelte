<style lang="scss">
  $aspect-ratio: 2.848;
  $container-height: 20vh;
  $container-width: unquote("min(800px, 80vw)");

  #lag-warning {
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
      transform: translate3d(0, -80%, 0);
      width: $container-width;

      > div {
        height: $container-height;
        overflow: hidden;
        position: relative;
      }
    }

    &:global(.fade-out) {
      opacity: 0;
      transition: opacity 1s ease;
    }

    p {
        z-index: 50;
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
  }
</style>

<script>
  import { fade } from "svelte/transition";

</script>

<div id="lag-warning" transition:fade>
    <div>
        <div>
            <span>Latency Warning!</span>
   <p>
    Your web browser seems to be having difficulty playing this roll, and as a result some notes may not be sounding when they should. Please consider following the suggestions in <a href="google.com" target="blank">the documentation</a> to attempt to improve the performance.
   </p>

        </div>
    </div>
</div>

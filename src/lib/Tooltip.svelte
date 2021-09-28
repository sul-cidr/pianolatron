<svelte:options accessors />

<style lang="scss">
  div {
    z-index: z($main-context, tooltips);
  }

  span {
    animation: tooltip 0.2s ease-out;
    background-color: hsla(0, 0%, 20%, 0.9);
    border-radius: 3px;
    color: #fff;
    display: inline-block;
    line-height: 1.2;
    max-width: 250px;
    min-width: 70px;
    padding: 7px;
    position: relative;
    text-align: center;
    transform: translate(0, -5px);
    white-space: pre-line;
    width: max-content;

    &::after {
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid hsla(0, 0%, 20%, 0.9);
      top: 100%;
      content: " ";
      font-size: 0;
      left: 50%;
      line-height: 0;
      position: absolute;
      width: 0;
    }
  }

  @keyframes tooltip {
    from {
      opacity: 0;
      transform: translate(0, 0);
    }
    to {
      opacity: 1;
      transform: translate(0, -5px);
    }
  }
</style>

<script>
  export let text;
  export let element;
</script>

<div bind:this={element}>
  <span>{text}</span>
</div>

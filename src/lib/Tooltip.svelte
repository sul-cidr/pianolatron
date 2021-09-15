<svelte:options accessors />

<style lang="scss">
  .tooltip {
    background-color: hsla(0, 0%, 20%, 0.9);
    border-radius: 3px;
    color: #fff;
    left: 50%;
    line-height: 1.2;
    max-width: 250px;
    min-width: 70px;
    padding: 7px;
    position: absolute;
    text-align: center;
    white-space: pre-line;
    width: max-content;
    z-index: 13;

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
</style>

<script>
  export let text;
  export let element;
</script>

<span class="tooltip" bind:this={element}>{text}</span>

<style lang="scss">
  svg {
    position: absolute;
    top: 0;
    height: 6em;
    // transform: rotate(90deg);
    // z-index: 4;
    outline: 1px solid red;
  }

  .circle {
    // background-color: #9b59b6;
    border-radius: 50%;
    width: 6em;
    height: 6em;
    // transform: translate3d(-50%, -50%, 0);
    // left: 50%;
    // top: 50%;
    // box-shadow: 0 0 10px rgba(#000, 0.5);
    position: relative;
    transform: rotate(-90deg);
    // border-width: 8px;
    // border-color: transparent;

    &:before {
      content: "";
      position: absolute;
      width: 80%;
      height: 80%;
      background-color: #ecf0f1;
      border-radius: 50%;
      top: 10%;
      left: 10%;
      // box-shadow: inset 0 0 10px rgba(#000, 0.5);
    }

    .dot {
      position: absolute;
      //background-color: green;
      width: 5%;
      height: 50%;
      left: 47.5%;
      top: 0;
      transform-origin: center bottom;

      &:before {
        content: "";
        position: absolute;
        background-color: orange;
        // box-shadow: 0 0 10px #000;
        top: 16px;
        width: 4px;
        transform: translate3d(-25%, -25%, 0);
        height: 18px;
        // padding-bottom: 200%;
        // border-radius: 50%;
        cursor: pointer;
      }
    }
  }

  .debug {
    color: #9b59b6;
    user-select: none;
  }
</style>

<script>
  import { onMount } from "svelte";

  export let startAngle = 0;

  let dragging = false;
  let circle;
  let centerX;
  let centerY;

  let angle = 0;
  let perc = 0;

  onMount(async () => {
    const circleBounds = circle.getBoundingClientRect();
    centerX = circleBounds.width / 2 + circleBounds.x;
    centerY = circleBounds.height / 2 + circleBounds.y;
  });

  const handleMove = (event) => {
    if (!dragging) return;
    const [touch] = event.touches || [];
    const deltaX = centerX - (event.pageX || touch.pageX);
    const deltaY = centerY - (event.pageY || touch.pageY);

    angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Calculate Angle between circle center and mouse pos
    // angle -= 90;
    angle = Math.round((angle + 360) % 360);
    perc = (2 * Math.PI) / (360 / angle);
  };
</script>

<svg viewBox="-2 -2 4 4">
  <circle
    cx="0"
    cy="0"
    r="1"
    transform="rotate(180)"
    stroke-width="2"
    stroke-dasharray={`${perc}, ${2 * Math.PI - perc}`}
    stroke="green"
    fill="none"
  />
</svg>
<div
  class="circle"
  bind:this={circle}
  on:mousedown={() => (dragging = true)}
  on:touchstart={() => (dragging = true)}
>
  <div class="dot" style={`transform: rotate(${angle}deg)`} />
</div>
<div class="debug">{angle}deg</div>

<svelte:window
  on:mouseup={() => (dragging = false)}
  on:touchend={() => (dragging = false)}
  on:mousemove={handleMove}
  on:touchmove={handleMove}
/>

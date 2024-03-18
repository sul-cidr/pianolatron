<style lang="scss">
  // based on https://github.com/darlanrod/input-range-scss
  // which is, in turn, based on
  // https://css-tricks.com/styling-cross-browser-compatible-range-inputs-css/
  $track-color: #eaeaea;
  $thumb-color: var(--primary-accent);

  $thumb-radius: 14px;
  $thumb-height: 14px;
  $thumb-width: 14px;
  $thumb-shadow-size: 2px;
  $thumb-shadow-blur: 4px;
  $thumb-shadow-color: rgba(0, 0, 0, 0.2);
  $thumb-border-width: 0px;
  $thumb-border-color: #eaeaea;

  $track-width: 100%;
  $track-height: 2px;
  $track-shadow-size: 1px;
  $track-shadow-blur: 1px;
  $track-shadow-color: rgba(0, 0, 0, 0.2);
  $track-border-width: 0px;
  $track-border-color: #cfd8dc;

  $track-radius: 5px;
  $contrast: 5%;

  $ie-bottom-track-color: darken($track-color, $contrast);

  @mixin shadow($shadow-size, $shadow-blur, $shadow-color) {
    box-shadow:
      $shadow-size $shadow-size $shadow-blur $shadow-color,
      0 0 $shadow-size lighten($shadow-color, 5%);
  }

  @mixin track {
    cursor: default;
    height: $track-height;
    transition: all 0.2s ease;
    width: 100%;
  }

  @mixin thumb {
    @include shadow(
      $thumb-shadow-size,
      $thumb-shadow-blur,
      $thumb-shadow-color
    );
    background: $thumb-color;
    border: $thumb-border-width solid $thumb-border-color;
    border-radius: $thumb-radius;
    box-sizing: border-box;
    cursor: default;
    height: $thumb-height;
    width: $thumb-width;
  }

  .double-range-container {
    width: 95%;
    margin: 2px 0;
    user-select: none;
    box-sizing: border-box;
    white-space: nowrap;
  }

  .slider {
    @include track;
    @include shadow(
      $track-shadow-size,
      $track-shadow-blur,
      $track-shadow-color
    );
    cursor: default;
    height: $track-height;
    transition: all 0.2s ease;
    width: 100%;
    position: relative;
    top: 50%;
    transform: translate(0, -50%);
    background-color: $track-color;
    border: $track-border-width solid $track-border-color;
    border-radius: $track-radius;
  }

  .handle {
    position: absolute;
    top: 50%;
    width: 0;
    height: 0;
  }
  .handle:after {
    content: " ";
    box-sizing: border-box;
    position: absolute;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    background-color: #fdfdfd;
    border: 1px solid #7b7b7b;
    transform: translate(-50%, -50%);
  }
  /* .handle[data-which="end"]:after{
		transform: translate(-100%, -50%);
	} */
  .handle:active:after {
    background-color: #ddd;
    z-index: 9;
  }

  .body {
    top: 0;
    position: absolute;
    color: $thumb-color;
    background-color: $track-color;
    bottom: 0;
    -webkit-appearance: none;
    background: transparent;
    margin: math.div($thumb-height, 2) 0;
    width: $track-width;

    &::-moz-focus-outer {
      border: 0;
    }

    &:focus {
      outline: 0;

      &::-webkit-slider-runnable-track {
        background: lighten($track-color, $contrast);
      }

      &::-ms-fill-lower {
        background: $track-color;
      }

      &::-ms-fill-upper {
        background: lighten($track-color, $contrast);
      }
    }
  }
</style>

<script>
  const clamp = (_value) => Math.min(Math.max(_value, min), max);

  export let start = 0;
  export let end = 1;
  export let name;
  export let mousewheel = true;

  let leftHandle;

  let body;
  let slider;

  function draggable(node) {
    let x;
    let y;

    function handleMousedown(event) {
      if (event.type === "touchstart") {
        event = event.touches[0];
      }
      x = event.clientX;
      y = event.clientY;

      node.dispatchEvent(
        new CustomEvent("dragstart", {
          detail: { x, y },
        }),
      );

      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);

      window.addEventListener("touchmove", handleMousemove);
      window.addEventListener("touchend", handleMouseup);
    }

    function handleMousemove(event) {
      if (event.type === "touchmove") {
        event = event.changedTouches[0];
      }

      const dx = event.clientX - x;
      const dy = event.clientY - y;

      x = event.clientX;
      y = event.clientY;

      node.dispatchEvent(
        new CustomEvent("dragmove", {
          detail: { x, y, dx, dy },
        }),
      );
    }

    function handleMouseup(event) {
      x = event.clientX;
      y = event.clientY;

      node.dispatchEvent(
        new CustomEvent("dragend", {
          detail: { x, y },
        }),
      );

      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);

      window.removeEventListener("touchmove", handleMousemove);
      window.removeEventListener("touchend", handleMouseup);
    }

    node.addEventListener("mousedown", handleMousedown);
    node.addEventListener("touchstart", handleMousedown);

    return {
      destroy() {
        node.removeEventListener("mousedown", handleMousedown);
        node.removeEventListener("touchstart", handleMousedown);
      },
    };
  }

  function setHandlePosition(which) {
    return function (evt) {
      const { left, right } = slider.getBoundingClientRect();
      const parentWidth = right - left;

      const p = Math.min(Math.max((evt.detail.x - left) / parentWidth, 0), 1);

      if (which === "start") {
        start = p;
        end = Math.max(end, p);
      } else {
        start = Math.min(p, start);
        end = p;
      }
    };
  }

  function setHandlesFromBody(evt) {
    const { width } = body.getBoundingClientRect();
    const { left, right } = slider.getBoundingClientRect();

    const parentWidth = right - left;

    const leftHandleLeft = leftHandle.getBoundingClientRect().left;

    const pxStart = clamp(
      leftHandleLeft + evt.detail.dx - left,
      0,
      parentWidth - width,
    );
    const pxEnd = clamp(pxStart + width, width, parentWidth);

    const pStart = pxStart / parentWidth;
    const pEnd = pxEnd / parentWidth;

    start = pStart;
    end = pEnd;
  }
</script>

<div class="double-range-container">
  <div class="slider" bind:this={slider}>
    <div
      class="body"
      bind:this={body}
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlesFromBody}
      style="
				left: {100 * start}%;
				right: {100 * (1 - end)}%;
			"
    ></div>
    <div
      class="handle"
      bind:this={leftHandle}
      data-which="start"
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlePosition("start")}
      style="
				left: {100 * start}%
			"
    ></div>
    <div
      class="handle"
      data-which="end"
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlePosition("end")}
      style="
				left: {100 * end}%
			"
    ></div>
  </div>
</div>

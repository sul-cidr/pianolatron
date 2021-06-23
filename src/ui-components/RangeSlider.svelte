<style lang="scss">
  // based on https://github.com/darlanrod/input-range-scss
  // which is, in turn, based on
  // https://css-tricks.com/styling-cross-browser-compatible-range-inputs-css/
  $track-color: #eaeaea;
  $thumb-color: var(--primary-accent);

  $thumb-radius: 12px;
  $thumb-height: 28px;
  $thumb-width: 12px;
  $thumb-shadow-size: 2px;
  $thumb-shadow-blur: 4px;
  $thumb-shadow-color: rgba(0, 0, 0, 0.2);
  $thumb-border-width: 2px;
  $thumb-border-color: #eaeaea;

  $track-width: 18em;
  $track-height: 8px;
  $track-shadow-size: 1px;
  $track-shadow-blur: 1px;
  $track-shadow-color: rgba(0, 0, 0, 0.2);
  $track-border-width: 0px;
  $track-border-color: #cfd8dc;

  $track-radius: 5px;
  $contrast: 5%;

  $ie-bottom-track-color: darken($track-color, $contrast);

  @mixin shadow($shadow-size, $shadow-blur, $shadow-color) {
    box-shadow: $shadow-size $shadow-size $shadow-blur $shadow-color,
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

  [type="range"] {
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

    &::-webkit-slider-runnable-track {
      @include track;
      @include shadow(
        $track-shadow-size,
        $track-shadow-blur,
        $track-shadow-color
      );
      background: $track-color;
      border: $track-border-width solid $track-border-color;
      border-radius: $track-radius;
    }

    &::-webkit-slider-thumb {
      @include thumb;
      -webkit-appearance: none;
      margin-top: (
        math.div((-$track-border-width * 2 + $track-height), 2) -
          math.div($thumb-height, 2)
      );
    }

    &::-moz-range-track {
      @include shadow(
        $track-shadow-size,
        $track-shadow-blur,
        $track-shadow-color
      );
      @include track;
      background: $track-color;
      border: $track-border-width solid $track-border-color;
      border-radius: $track-radius;
      height: math.div($track-height, 2);
    }

    &::-moz-range-thumb {
      @include thumb;
    }

    &::-ms-track {
      @include track;
      background: transparent;
      border-color: transparent;
      border-width: math.div($thumb-height, 2) 0;
      color: transparent;
    }

    &::-ms-fill-lower {
      @include shadow(
        $track-shadow-size,
        $track-shadow-blur,
        $track-shadow-color
      );
      background: $ie-bottom-track-color;
      border: $track-border-width solid $track-border-color;
      border-radius: ($track-radius * 2);
    }

    &::-ms-fill-upper {
      @include shadow(
        $track-shadow-size,
        $track-shadow-blur,
        $track-shadow-color
      );
      background: $track-color;
      border: $track-border-width solid $track-border-color;
      border-radius: ($track-radius * 2);
    }

    &::-ms-thumb {
      @include thumb;
      margin-top: math.div($track-height, 4);
    }

    &:disabled {
      &::-webkit-slider-thumb,
      &::-moz-range-thumb,
      &::-ms-thumb,
      &::-webkit-slider-runnable-track,
      &::-ms-fill-lower,
      &::-ms-fill-upper {
        cursor: not-allowed;
      }
    }
  }
</style>

<script>
  export let min;
  export let max;
  export let step;
  export let name;
  export let value;
  export let mousewheel = true;

  const clamp = (_value) => Math.min(Math.max(_value, min), max);

  const handleWheel = (event) => {
    const precision = (step.split(".")[1] || "").length;
    if (event.deltaY > 0) {
      value = clamp((Number(value) + Number(step)).toFixed(precision));
    } else {
      value = clamp((Number(value) - Number(step)).toFixed(precision));
    }
  };
</script>

<input
  type="range"
  bind:value
  on:input
  on:mousewheel={mousewheel ? handleWheel : () => {}}
  {min}
  {max}
  {step}
  {name}
/>

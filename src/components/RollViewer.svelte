<style lang="scss">
  $hole-highlight-color: yellow;
  $highlight-hover-outline-color: darkturquoise;
  $highlight-hover-outline-width: 6px;
  $highlight-hover-outline-offset: 8px;

  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

    p {
      background: rgba(black, 0.4);
      border-radius: 4px;
      color: white;
      left: 1em;
      padding: 4px 8px;
      position: absolute;
      top: 1em;
      z-index: 1;
    }

    &::before {
      background: var(--primary-accent);
      content: "";
      display: block;
      height: 1px;
      pointer-events: none;
      position: absolute;
      top: 50%;
      width: 100%;
      z-index: 1;
    }

    &::after {
      @include background;
      bottom: 0;
      content: " ";
      left: 0;
      mix-blend-mode: multiply;
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
    }

    :global(canvas) {
      background: white !important;
    }

    :global(.openseadragon-canvas:focus) {
      outline: none;
    }

    :global(mark) {
      background-color: transparent;

      &.active {
        &::before {
          position: absolute;
          content: "";
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          mix-blend-mode: multiply;
          animation: mark-recede 0.5s ease-in-out;
          background-color: $hole-highlight-color;
          box-shadow: 0 0 5px $hole-highlight-color;
          display: inline-block;
        }
      }

      &:hover {
        background-color: transparent;
        box-shadow: none;
        outline: $highlight-hover-outline-width solid
          $highlight-hover-outline-color;
        outline-offset: $highlight-hover-outline-offset;
        z-index: 1;

        &::before {
          height: 0;
          position: relative;
        }

        &[data-info]::after {
          background-color: $highlight-hover-outline-color;
          color: white;
          content: attr(data-info);
          display: block;
          font-weight: bold;
          left: calc(
            100% + #{$highlight-hover-outline-offset} + #{$highlight-hover-outline-width}
          );
          padding: 8px ($highlight-hover-outline-width + 4px) 8px 4px;
          position: absolute;
          text-shadow: 0px 0px 8px black;
          top: -($highlight-hover-outline-offset +
                $highlight-hover-outline-width);
          transform: none;
        }
      }
    }

    :global(svg rect) {
      fill: none;
      pointer-events: all;
    }

    &.active-note-details {
      :global(mark.active[data-info]::after) {
        background-color: none;
        color: white;
        content: attr(data-info);
        display: block;
        font-weight: bold;
        left: 50%;
        padding: 8px 4px;
        position: absolute;
        text-shadow: 0px 0px 8px black;
        top: 0;
        mix-blend-mode: normal;
        transform: translate(-50%, -100%);
      }

      :global(mark.active[data-info]:hover::after) {
        left: calc(
          100% + #{$highlight-hover-outline-offset} + #{$highlight-hover-outline-width}
        );
        top: -($highlight-hover-outline-offset + $highlight-hover-outline-width);
        transform: none;
      }
    }
  }

  @keyframes mark-recede {
    from {
      border-radius: 30%;
      mix-blend-mode: normal;
    }
  }
</style>

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import OpenSeadragon from "openseadragon";
  import { rollMetadata, currentTick, userSettings } from "../stores";
  import { clamp } from "../utils";
  import RollViewerControls from "./RollViewerControls.svelte";

  export let imageUrl;
  export let holesByTickInterval;
  export let skipToTick;

  const WELTE_RED_FIRST_NOTE = 24;
  const WELTE_RED_LAST_NOTE = 103;

  const defaultZoomLevel = 1;
  const minZoomLevel = 0.1;
  const maxZoomLevel = 4;

  let openSeadragon;
  let viewport;
  let firstHolePx;
  let strafing = false;
  let rollImageReady;
  let marks = [];
  let hoveredMark;
  let showControls;
  let imageLength;

  const getNoteName = (midiNumber) => {
    if (
      midiNumber >= WELTE_RED_FIRST_NOTE &&
      midiNumber <= WELTE_RED_LAST_NOTE
    ) {
      const octave = parseInt(midiNumber / 12, 10) - 1;
      const name = [
        "A",
        "A#",
        "B",
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
      ][(midiNumber - 21) % 12];
      return `${name}${octave}`;
    }
    return null;
  };

  const createMark = (hole) => {
    const { WIDTH_COL, ORIGIN_COL, ORIGIN_ROW, OFF_TIME, MIDI_KEY, TRACKER_HOLE } = hole;
    const mark = document.createElement("mark");
    const noteName = getNoteName(MIDI_KEY);
    if (noteName) mark.dataset.info = noteName;
    mark.addEventListener("mouseout", () => {
      if (!marks.map(([_hole]) => _hole).includes(hole))
        viewport.viewer.removeOverlay(hoveredMark);
    });
    const viewportRectangle = viewport.imageToViewportRectangle(
        ORIGIN_COL,
        scrollDownwards ? ORIGIN_ROW : imageLength - OFF_TIME,
        WIDTH_COL,
        OFF_TIME - ORIGIN_ROW,
      );
    viewport.viewer.addOverlay(mark, viewportRectangle);
    return mark;
  };

  const createHolesOverlaySvg = () => {
    const { IMAGE_WIDTH, holeData } = $rollMetadata;
    if (!holeData) return;

    const imageWidth = parseInt(IMAGE_WIDTH, 10);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const entireViewportRectangle = viewport.imageToViewportRectangle(
      0,
      0,
      imageWidth,
      imageLength,
    );

    svg.setAttribute("width", imageWidth);
    svg.setAttribute("height", imageLength);
    svg.setAttribute("viewBox", `0 0 ${imageWidth} ${imageLength}`);
    svg.appendChild(g);

    holeData.forEach((hole) => {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      const { ORIGIN_COL, ORIGIN_ROW, WIDTH_COL, OFF_TIME } = hole;

      rect.setAttribute("x", ORIGIN_COL);
      rect.setAttribute("y", scrollDownwards ? ORIGIN_ROW : imageLength - OFF_TIME);
      rect.setAttribute("width", WIDTH_COL);
      rect.setAttribute("height", OFF_TIME - ORIGIN_ROW);
      rect.addEventListener("mouseover", () => {
        if (marks.map(([_hole]) => _hole).includes(hole)) return;
        viewport.viewer.removeOverlay(hoveredMark);
        hoveredMark = createMark(hole);
      });

      g.appendChild(rect);
    });

    viewport.viewer.addOverlay(svg, entireViewportRectangle);
  };

  const advanceToTick = (tick) => {
    if (!openSeadragon) return;
    // if we're panning horizontally we want the target bounds, if otherwise
    //  (and most especially if we happen to be zooming) we want the current bounds
    const viewportBounds = viewport.getBounds(!strafing);
    const linePx = firstHolePx + (scrollDownwards ? tick : -tick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);
    const lineCenter = new OpenSeadragon.Point(
      viewportBounds.x + viewportBounds.width / 2,
      lineViewport.y,
    );

    viewport.panTo(lineCenter);
  };

  const highlightHoles = (tick) => {
    if (!openSeadragon) return;

    const holes = holesByTickInterval.search(tick, tick);

    marks = marks.filter(([hole, elem]) => {
      if (holes.includes(hole)) return true;
      viewport.viewer.removeOverlay(elem);
      return false;
    });

    holes.forEach((hole) => {
      if (marks.map(([_hole]) => _hole).includes(hole)) return;
      const mark = createMark(hole);
      mark.classList.add("active");
      marks.push([hole, mark]);
    });
  };

  onMount(async () => {
    openSeadragon = OpenSeadragon({
      id: "roll-viewer",
      showNavigationControl: false,
      panHorizontal: true,
      visibilityRatio: 1,
      defaultZoomLevel,
      minZoomLevel,
      maxZoomLevel,
      constrainDuringPan: true,
      preserveImageSizeOnResize: true,
    });

    ({ viewport } = openSeadragon);

    openSeadragon.addOnceHandler("update-viewport", () => {
      createHolesOverlaySvg();
      advanceToTick(0);
    });
    openSeadragon.addHandler("canvas-drag", () => {
      const viewportCenter = viewport.getCenter(false);
      const imgCenter = viewport.viewportToImageCoordinates(viewportCenter);
      skipToTick(
        scrollDownwards ? imgCenter.y - firstHolePx : firstHolePx - imgCenter.y,
      );
      strafing = true;
    });
    openSeadragon.addHandler("canvas-drag-end", () => (strafing = false));
    openSeadragon.addHandler("open", () => {
      const tiledImage = viewport.viewer.world.getItemAt(0);
      tiledImage.addOnceHandler(
        "fully-loaded-change",
        () => (rollImageReady = true),
      );
    });
    openSeadragon.open(imageUrl);
  });

  const panByIncrement = (up = true) => {
    const viewportBounds = viewport.getBounds();
    const imgBounds = viewport.viewportToImageRectangle(viewportBounds);
    const delta = up ? imgBounds.height / 10 : -imgBounds.height / 10;
    const centerY = imgBounds.y + imgBounds.height / 2;
    skipToTick(
      scrollDownwards
        ? clamp(
            centerY + delta - firstHolePx,
            -firstHolePx,
            imageLength - firstHolePx,
          )
        : clamp(
            firstHolePx - centerY - delta,
            -firstHolePx,
            imageLength - firstHolePx,
          ),
    );
  };

  $: advanceToTick($currentTick);
  $: highlightHoles($currentTick);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
  $: imageLength = parseInt($rollMetadata.IMAGE_LENGTH, 10);
  $: firstHolePx = scrollDownwards
    ? parseInt($rollMetadata.FIRST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.FIRST_HOLE, 10);
</script>

<div
  id="roll-viewer"
  on:mouseenter={() => (showControls = true)}
  on:mouseleave={() => (showControls = false)}
  on:wheel|capture|preventDefault={(event) => {
    if (event.ctrlKey) {
      panByIncrement(event.deltaY > 0);
      event.stopPropagation();
    }
  }}
  class:active-note-details={$userSettings.activeNoteDetails}
>
  {#if !rollImageReady}
    <p transition:fade>Downloading roll image...</p>
  {/if}
  {#if showControls}
    <RollViewerControls
      bind:strafing
      {openSeadragon}
      {minZoomLevel}
      {maxZoomLevel}
      {panByIncrement}
    />
  {/if}
</div>

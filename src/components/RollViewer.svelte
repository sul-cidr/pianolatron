<style lang="scss">
  $hole-highlight-color: yellow;
  $highlight-hover-outline-color: darkturquoise;
  $highlight-hover-outline-width: 6px;
  $highlight-hover-outline-offset: 8px;

  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

    &::before {
      background: $primary-accent;
      content: "";
      display: block;
      height: 1px;
      pointer-events: none;
      position: absolute;
      top: 50%;
      width: 100%;
      z-index: 3;
    }

    &::after {
      background-color: $background-color;
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
      mix-blend-mode: multiply;

      &.active {
        animation: mark-recede 0.5s ease-in-out;
        background-color: $hole-highlight-color;
        box-shadow: 0 0 5px $hole-highlight-color;
      }

      &:hover {
        background-color: transparent;
        box-shadow: none;
        mix-blend-mode: normal;
        outline: $highlight-hover-outline-width solid
          $highlight-hover-outline-color;
        outline-offset: $highlight-hover-outline-offset;
        z-index: 4;

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
        }
      }
    }

    :global(svg rect) {
      fill: none;
      pointer-events: all;
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
  import OpenSeadragon from "openseadragon";
  import { rollMetadata, currentTick } from "../stores";

  export let imageUrl;
  export let holesByTickInterval;

  const WELTE_MIDI_START = 10;
  const WELTE_RED_FIRST_NOTE = 24;
  const WELTE_RED_LAST_NOTE = 103;

  let openSeadragon;
  let firstHolePx;
  let dragging;
  let marks = [];
  let hoveredMark;

  const getNoteName = (trackerHole) => {
    const midiNumber = trackerHole + WELTE_MIDI_START;
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
    const { WIDTH_COL, ORIGIN_COL, ORIGIN_ROW, OFF_TIME, TRACKER_HOLE } = hole;
    const mark = document.createElement("mark");
    const noteName = getNoteName(TRACKER_HOLE);
    if (noteName) mark.dataset.info = noteName;
    mark.addEventListener("mouseout", () => {
      if (!marks.map(([_hole]) => _hole).includes(hole))
        openSeadragon.viewport.viewer.removeOverlay(hoveredMark);
    });
    const viewportRectangle = openSeadragon.viewport.imageToViewportRectangle(
      ORIGIN_COL,
      ORIGIN_ROW,
      WIDTH_COL,
      OFF_TIME - ORIGIN_ROW,
    );
    openSeadragon.viewport.viewer.addOverlay(mark, viewportRectangle);
    return mark;
  };

  const createHolesOverlaySvg = () => {
    const { IMAGE_WIDTH, IMAGE_LENGTH, holeData } = $rollMetadata;
    const imageWidth = parseInt(IMAGE_WIDTH, 10);
    const imageLength = parseInt(IMAGE_LENGTH, 10);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const entireViewportRectangle = openSeadragon.viewport.imageToViewportRectangle(
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
      rect.setAttribute("y", ORIGIN_ROW);
      rect.setAttribute("width", WIDTH_COL);
      rect.setAttribute("height", OFF_TIME - ORIGIN_ROW);
      rect.addEventListener("mouseover", () => {
        if (marks.map(([_hole]) => _hole).includes(hole)) return;
        openSeadragon.viewport.viewer.removeOverlay(hoveredMark);
        hoveredMark = createMark(hole);
      });

      g.appendChild(rect);
    });

    openSeadragon.viewport.viewer.addOverlay(svg, entireViewportRectangle);
  };

  const panViewportToTick = (tick) => {
    if (!openSeadragon) return;
    const { viewport } = openSeadragon;
    // if we're dragging we want the target bounds, if otherwise (and most
    //   especially if we happen to be zooming) we want the current bounds
    const viewportBounds = viewport.getBounds(!dragging);
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
      openSeadragon.viewport.viewer.removeOverlay(elem);
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
      defaultZoomLevel: 1,
      minZoomLevel: 0.01,
      maxZoomLevel: 4,
      constrainDuringPan: true,
    });

    openSeadragon.addOnceHandler("update-viewport", () => {
      createHolesOverlaySvg();
      panViewportToTick(0);
    });
    openSeadragon.addHandler("canvas-drag", () => (dragging = true));
    openSeadragon.addHandler("canvas-drag-end", () => (dragging = false));
    openSeadragon.open(imageUrl);
  });

  $: panViewportToTick($currentTick);
  $: highlightHoles($currentTick);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
  $: firstHolePx = scrollDownwards
    ? parseInt($rollMetadata.FIRST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.FIRST_HOLE, 10);
</script>

<div id="roll-viewer" />

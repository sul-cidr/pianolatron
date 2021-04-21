<style lang="scss">
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
      animation: mark-recede 0.5s ease-in-out;
      background-color: yellow;
      box-shadow: 0 0 5px yellow;
      mix-blend-mode: multiply;
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

  const WELTE_MIDI_START = 14;
  const WELTE_RED_FIRST_NOTE = 28;
  const WELTE_RED_LAST_NOTE = 103;

  let openSeadragon;
  let firstHolePx;
  let dragging;
  let marks = [];

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
    return "??";
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

      const {
        WIDTH_COL,
        ORIGIN_COL,
        ORIGIN_ROW,
        OFF_TIME,
        TRACKER_HOLE,
      } = hole;
      const mark = document.createElement("mark");
      mark.dataset.info = getNoteName(TRACKER_HOLE);
      const viewportRectangle = openSeadragon.viewport.imageToViewportRectangle(
        ORIGIN_COL,
        ORIGIN_ROW,
        WIDTH_COL,
        OFF_TIME - ORIGIN_ROW,
      );
      openSeadragon.viewport.viewer.addOverlay(mark, viewportRectangle);

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

    openSeadragon.addOnceHandler("update-viewport", () => panViewportToTick(0));
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

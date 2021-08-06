<style lang="scss">
  // See styles/hole-highlighting.scss for all the <mark/> and <rect/> styling

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
      background-color: var(--primary-accent-semiopaque);
      border: 1px solid var(--primary-accent);
      content: "";
      display: block;
      height: var(--trackerbar-height);
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
  }
</style>

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import OpenSeadragon from "openseadragon";
  import {
    rollMetadata,
    currentTick,
    userSettings,
    animatePan,
    playExpressionsOnOff,
    rollPedalingOnOff,
  } from "../stores";
  import {
    clamp,
    getNoteLabel,
    normalizeInRange,
    mapToRange,
    getHoleType,
  } from "../utils";
  import RollViewerControls from "./RollViewerControls.svelte";

  export let imageUrl;
  export let holesByTickInterval;
  export let skipToTick;

  // This is the "coolwarm" color map -- blue to red
  // RdYlBu (reversed) sort of works, but the yellows are too ambiguous
  // (values in H, S, L)
  const holeColorMap = [
    "232, 53%, 49%",
    "229, 64%, 58%",
    "225, 78%, 66%",
    "223, 91%, 73%",
    "221, 98%, 79%",
    "219, 95%, 83%",
    "217, 73%, 86%",
    "217, 26%, 87%",
    "21, 28%, 86%",
    "20, 69%, 83%",
    "18, 85%, 79%",
    "16, 85%, 73%",
    "13, 80%, 67%",
    "9, 70%, 59%",
    "2, 59%, 51%",
    "348, 96%, 36%",
  ];

  const defaultHoleColor = "60, 100%, 50%"; // yellow (default)
  const controlHoleColor = "120, 73%, 75%"; // light green
  const pedalHoleColor = "39, 100%, 50%"; // orange;

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
  let imageWidth;
  let avgHoleWidth;

  const calculateHoleColors = (holeData) => {
    const velocities = holeData.map(({ v }) => v).filter((v) => v);
    const minNoteVelocity = velocities.length ? Math.min(...velocities) : 64;
    const maxNoteVelocity = velocities.length ? Math.max(...velocities) : 64;

    const getNoteHoleColor = ({ v: velocity }) =>
      holeColorMap[
        Math.round(
          mapToRange(
            normalizeInRange(velocity, minNoteVelocity, maxNoteVelocity),
            0,
            holeColorMap.length - 1,
          ),
        )
      ];

    holeData.forEach((hole) => {
      switch (getHoleType(hole, $rollMetadata.ROLL_TYPE)) {
        case "pedal":
          hole.color = pedalHoleColor;
          hole.type = "pedal";
          break;

        case "control":
          hole.color = controlHoleColor;
          hole.type = "control";
          break;

        case "note":
          hole.color = getNoteHoleColor(hole);
          hole.type = "note";
          break;

        default:
          hole.color = defaultHoleColor;
      }
    });
  };

  const createMark = (hole) => {
    const {
      x: offsetX,
      y: offsetY,
      w: width,
      h: height,
      m: midiKey,
      v: velocity,
      color: holeColor,
      type: holeType,
    } = hole;
    const mark = document.createElement("mark");

    const noteLabel = getNoteLabel(midiKey, $rollMetadata.ROLL_TYPE);
    mark.dataset.noteLabel = noteLabel;
    if (holeType === "note")
      mark.dataset.noteLabelExtra = `${noteLabel}\nv:${velocity}`;

    mark.style.setProperty("--highlight-color", `hsl(${holeColor})`);
    mark.classList.add(holeType);

    mark.addEventListener("mouseout", () => {
      if (!marks.map(([_hole]) => _hole).includes(hole))
        viewport.viewer.removeOverlay(hoveredMark);
    });

    const imgBounds = viewport.viewportToImageRectangle(viewport.getBounds());
    const markFractionalPosition =
      parseFloat(offsetX + width / 2 - imgBounds.x) /
      parseFloat(imgBounds.width);
    mark.classList.toggle("flag-left", markFractionalPosition > 0.8);

    const viewportRectangle = viewport.imageToViewportRectangle(
      offsetX - 4,
      scrollDownwards ? offsetY - 4 : imageLength - offsetY - height - 4,
      width + 11,
      height + 12,
    );
    viewport.viewer.addOverlay(mark, viewportRectangle);
    return mark;
  };

  const createHolesOverlaySvg = () => {
    const { holeData } = $rollMetadata;
    if (!holeData) return;

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
      const {
        x: offsetX,
        y: offsetY,
        w: width,
        h: height,
        color: holeColor,
        type: holeType,
      } = hole;
      const padding = 10;

      rect.setAttribute("x", offsetX - padding);
      rect.setAttribute(
        "y",
        scrollDownwards
          ? offsetY - padding
          : imageLength - offsetY - height - padding,
      );
      rect.setAttribute("width", width + padding * 2);
      rect.setAttribute("height", height + padding * 2);
      rect.setAttribute("rx", 10);
      rect.setAttribute("ry", 10);
      rect.addEventListener("mouseover", () => {
        if (marks.map(([_hole]) => _hole).includes(hole)) return;
        viewport.viewer.removeOverlay(hoveredMark);
        hoveredMark = createMark(hole);
      });
      rect.setAttribute("fill", `hsla(${holeColor}, 0.8)`);
      rect.setAttribute("class", holeType);
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

    viewport.panTo(lineCenter, !$animatePan);
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
      gestureSettingsMouse: { clickToZoom: false },
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
    openSeadragon.addHandler("zoom", ({ zoom }) => {
      const imageZoom = viewport.viewportToImageZoom(zoom);
      const rv = document.getElementById("roll-viewer");
      if (!rv) return;
      const trackerbarHeight = Math.max(
        1,
        parseInt(avgHoleWidth * imageZoom, 10),
      );
      rv.style.setProperty("--trackerbar-height", `${trackerbarHeight}px`);
    });
    openSeadragon.open(imageUrl);
  });

  const panByIncrement = (up = true) => {
    const viewportBounds = viewport.getBounds();
    const imgBounds = viewport.viewportToImageRectangle(viewportBounds);
    const delta = up ? imgBounds.height / 200 : -imgBounds.height / 200;
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
            firstHolePx - imageLength,
            firstHolePx,
          ),
    );
  };

  $: advanceToTick($currentTick);
  $: highlightHoles($currentTick);
  $: calculateHoleColors($rollMetadata.holeData);
  $: scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red";
  $: imageLength = parseInt($rollMetadata.IMAGE_LENGTH, 10);
  $: imageWidth = parseInt($rollMetadata.IMAGE_WIDTH, 10);
  $: avgHoleWidth = parseInt($rollMetadata.AVG_HOLE_WIDTH, 10);
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
  class:highlight-all-holes={$userSettings.showAllHoles}
  class:show-note-velocities={$userSettings.showNoteVelocities}
  class:use-roll-pedaling={$rollPedalingOnOff}
  class:play-expressions={$playExpressionsOnOff}
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

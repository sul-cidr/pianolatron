<style lang="scss">
  $note-highlight-color: yellow;
  $highlight-hover-outline-color: darkturquoise;
  $highlight-hover-outline-width: 6px;
  $highlight-hover-outline-offset: 4px;

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

    :global(mark) {
      --highlight-color: #{$note-highlight-color};
      background-color: transparent;

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
      }
    }

    :global(mark.active::before) {
      position: absolute;
      content: "";
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      mix-blend-mode: multiply;
      animation: mark-recede 0.5s ease-in-out;
      background-color: var(--highlight-color);
      box-shadow: 0 0 5px var(--highlight-color);
      display: inline-block;
      border-radius: 20px;
    }

    :global(mark:hover[data-info]::after) {
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
      top: -($highlight-hover-outline-offset + $highlight-hover-outline-width);
      transform: none;
    }

    :global(mark.flag-left:hover[data-info]::after) {
      left: auto;
      right: calc(
        100% + #{$highlight-hover-outline-offset} + #{$highlight-hover-outline-width}
      );
      padding: 8px 4px 8px ($highlight-hover-outline-width + 4px);
    }

    :global(canvas) {
      background: white !important;
    }

    :global(.openseadragon-canvas:focus) {
      outline: none;
    }

    :global(svg rect) {
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
        pointer-events: none;
      }

      :global(mark.active[data-info]:hover::after) {
        left: calc(
          100% + #{$highlight-hover-outline-offset} + #{$highlight-hover-outline-width}
        );
        top: -($highlight-hover-outline-offset + $highlight-hover-outline-width);
        transform: none;
      }
      :global(mark.flag-left:hover[data-info]::after) {
        left: auto;
        right: calc(
          100% + #{$highlight-hover-outline-offset} + #{$highlight-hover-outline-width}
        );
        padding: 8px 4px 8px ($highlight-hover-outline-width + 4px);
      }
    }

    &:not(.highlight-all-holes) {
      :global(svg rect) {
        fill: none;
      }
    }

    &:not(.show-note-velocities) {
      :global(mark) {
        --highlight-color: #{$note-highlight-color} !important;
      }
    }
  }

  @keyframes mark-recede {
    from {
      mix-blend-mode: normal;
      padding: 4px;
      opacity: 0.8;
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
    hexToRGBA,
    holeType,
  } from "../utils";
  import RollViewerControls from "./RollViewerControls.svelte";

  export let imageUrl;
  export let holesByTickInterval;
  export let skipToTick;

  // This is the "coolwarm" color map -- blue to red
  // RdYlBu (reversed) sort of works, but the yellows are too ambiguous
  const holeColorMap = [
    "#3b4cc0",
    "#4f69d9",
    "#6485ec",
    "#7b9ff9",
    "#93b5fe",
    "#aac7fd",
    "#c0d4f5",
    "#d4dbe6",
    "#e5d8d1",
    "#f2cbb7",
    "#f7b89c",
    "#f5a081",
    "#ee8468",
    "#e0654f",
    "#cc403a",
    "#b40426",
  ];

  const noteHoleColor = "#ffff00"; // yellow (default)
  const controlHoleColor = "#90ee90"; // light green
  const pedalHoleColor = "#ffa500"; // orange;

  const defaultZoomLevel = 1;
  const minZoomLevel = 0.1;
  const maxZoomLevel = 4;

  let minNoteVelocity;
  let maxNoteVelocity;

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
    minNoteVelocity = 64;
    maxNoteVelocity = 64;
    if (
      $rollMetadata.ROLL_TYPE !== "88-note" &&
      $rollMetadata.ROLL_TYPE !== "65-note"
    ) {
      holeData.forEach((hole) => {
        const { v: velocity } = hole;
        if (velocity) {
          minNoteVelocity = Math.min(minNoteVelocity, velocity);
          maxNoteVelocity = Math.max(maxNoteVelocity, velocity);
        }
      });
    }

    holeData.forEach((hole) => {
      console.log(holeType(hole.m, $rollMetadata.ROLL_TYPE));
      switch (holeType(hole.m, $rollMetadata.ROLL_TYPE)) {
        case "pedal":
          hole.color = pedalHoleColor;
          break;

        case "control":
          hole.color = controlHoleColor;
          break;

        case "note":
          const velocityNormalized = normalizeInRange(
            hole.v,
            minNoteVelocity,
            maxNoteVelocity,
          );
          const velocityColorIndex = Math.round(
            mapToRange(velocityNormalized, 0, holeColorMap.length - 1),
          );
          hole.color = holeColorMap[velocityColorIndex];
          break;

        default:
          hole.color = "ffff00";
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
    } = hole;
    const mark = document.createElement("mark");
    let noteLabel = getNoteLabel(midiKey, $rollMetadata.ROLL_TYPE);
    mark.style.setProperty("--highlight-color", holeColor);
    if (velocity && $userSettings.showNoteVelocities && $playExpressionsOnOff) {
      noteLabel += `\nv:${velocity}`;
    }
    mark.dataset.info = noteLabel;
    mark.addEventListener("mouseout", () => {
      if (!marks.map(([_hole]) => _hole).includes(hole))
        viewport.viewer.removeOverlay(hoveredMark);
    });
    const viewportRectangle = viewport.imageToViewportRectangle(
      offsetX - 4,
      scrollDownwards ? offsetY - 4 : imageLength - offsetY - height - 4,
      width + 11,
      height + 12,
    );
    const imgBounds = viewport.viewportToImageRectangle(viewport.getBounds());
    const markFractionalPosition =
      parseFloat(offsetX + width / 2 - imgBounds.x) /
      parseFloat(imgBounds.width);
    mark.classList.toggle("flag-left", markFractionalPosition > 0.8);
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

    minNoteVelocity = 64;
    maxNoteVelocity = 64;
    if (
      $rollMetadata.ROLL_TYPE !== "88-note" &&
      $rollMetadata.ROLL_TYPE !== "65-note"
    ) {
      holeData.forEach((hole) => {
        const { v: velocity } = hole;
        if (velocity) {
          minNoteVelocity = Math.min(minNoteVelocity, velocity);
          maxNoteVelocity = Math.max(maxNoteVelocity, velocity);
        }
      });
    }

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
      rect.setAttribute("fill", hexToRGBA(holeColor, 0.8));
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

<style lang="scss">
  $note-highlight-color: yellow;
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
      --highlight-radius: 5px;
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
      box-shadow: 0 0 var(--highlight-radius) var(--highlight-color);
      display: inline-block;
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
    }
    &.hide-hole-overlays {
      :global(svg rect) {
        fill: none;
        stroke: none;
        stroke-width: none;
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
    isControlHole,
    isPedalHole,
    hexToRGBA,
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

  const holeColorAndRadius = (midiKey, velocity, alwaysColorizeVelocity) => {
    let color = "none";
    let radius = "5px";

    // Colorize control/pedal holes unless their functions are disabled
    if (isControlHole(midiKey, $rollMetadata.ROLL_TYPE)) {
      if (isPedalHole(midiKey, $rollMetadata.ROLL_TYPE)) {
        if ($rollPedalingOnOff) {
          color = pedalHoleColor;
        }
      } else if ($playExpressionsOnOff) {
        color = controlHoleColor;
      }
      // Do not colorize note holes if velocity viz or expression emulation is
      // disabled -- unless we're setting a rectangle's underlying color
    } else if (
      ((!$userSettings.showNoteVelocities || !$playExpressionsOnOff) &&
        !alwaysColorizeVelocity) ||
      velocity == null
    ) {
      color = noteHoleColor;
      // Colorize note holes according to the color map and scale glow radius
    } else {
      const velocityNormalized = normalizeInRange(
        velocity,
        minNoteVelocity,
        maxNoteVelocity,
      );
      const velocityMapped = mapToRange(velocityNormalized, 0.4, 1.0);
      const velocityMappedIndex = Math.round(
        mapToRange(velocityNormalized, 0, holeColorMap.length - 1),
      );
      color = holeColorMap[velocityMappedIndex];
      radius = `${parseInt(velocityMapped * 10, 10)}px`;
    }
    return [color, radius];
  };

  const createMark = (hole) => {
    const {
      x: offsetX,
      y: offsetY,
      w: width,
      h: height,
      m: midiKey,
      v: velocity,
    } = hole;
    const mark = document.createElement("mark");
    let noteLabel = getNoteLabel(midiKey, $rollMetadata.ROLL_TYPE);
    const [holeColor, holeRadius] = holeColorAndRadius(midiKey, velocity);
    mark.style.setProperty("--highlight-color", holeColor);
    mark.style.setProperty("--highlight-radius", holeRadius);
    if (velocity && $userSettings.showNoteVelocities && $playExpressionsOnOff) {
      noteLabel += `\nv:${velocity}`;
    }
    mark.dataset.info = noteLabel;
    mark.addEventListener("mouseout", () => {
      if (!marks.map(([_hole]) => _hole).includes(hole))
        viewport.viewer.removeOverlay(hoveredMark);
    });
    const viewportRectangle = viewport.imageToViewportRectangle(
      offsetX,
      scrollDownwards ? offsetY : imageLength - offsetY - height,
      width,
      height,
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
        m: midiKey,
        v: velocity,
      } = hole;
      rect.setAttribute("x", offsetX);
      rect.setAttribute(
        "y",
        scrollDownwards ? offsetY : imageLength - offsetY - height,
      );
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      rect.addEventListener("mouseover", () => {
        if (marks.map(([_hole]) => _hole).includes(hole)) return;
        viewport.viewer.removeOverlay(hoveredMark);
        hoveredMark = createMark(hole);
      });
      const [holeColor] = holeColorAndRadius(midiKey, velocity, true);
      rect.setAttribute("fill", hexToRGBA(holeColor, 0.8));
      rect.setAttribute("stroke", hexToRGBA(holeColor, 0.8));
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
  class:hide-hole-overlays={!$userSettings.showAllHoles}
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

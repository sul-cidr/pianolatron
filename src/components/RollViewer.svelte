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
      width: calc(100% - 40px);
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
    :global(.displayregion::after) {
      content: attr(data-label);
      display: block;
      position: absolute;
      width: 100%;
      font-size: 16px;
      text-align: center;
      padding: 8px 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        white 20%,
        white 80%,
        transparent 100%
      );
      top: calc(100% + 2px);
      transition: margin 1s ease;
    }

    :global(.displayregion.label-above::after) {
      margin-top: -100%;
      top: 0;
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
    playbackProgress,
  } from "../stores";
  import {
    clamp,
    mapToRange,
    normalizeInRange,
    getHoleLabel,
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
  let rollImageReady;
  let marks = [];
  let hoveredMark;
  let showControls;
  let imageLength;
  let imageWidth;
  let avgHoleWidth;
  let trackerbarHeight;

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
  let osdNavDisplayRegion;

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

    const holeLabel = getHoleLabel(midiKey, $rollMetadata.ROLL_TYPE);
    mark.dataset.holeLabel = holeLabel;
    if (holeType === "note") mark.dataset.noteVelocity = velocity || 64;

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
    const linePx = firstHolePx + (scrollDownwards ? tick : -tick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    if ($animatePan) {
      viewport.centerSpringY.springTo(lineViewport.y);
    } else {
      viewport.centerSpringY.resetTo(lineViewport.y);
    }

    osdNavDisplayRegion.dataset.label = ($playbackProgress * 100).toFixed(1);
    osdNavDisplayRegion.classList.toggle(
      "label-above",
      scrollDownwards ? $playbackProgress > 0.5 : $playbackProgress < 0.5,
    );
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
      gestureSettingsMouse: { clickToZoom: false, scrollToZoom: true },
      showNavigator: true,
      navigatorAutoFade: false,
      navigatorPosition: "ABSOLUTE",
      navigatorTop: "0px",
      navigatorLeft: "calc(100% - 40px)",
      navigatorHeight: "100%",
      navigatorWidth: "40px",
      navigatorDisplayRegionColor: "transparent",
    });

    const { navigator } = openSeadragon;
    ({ viewport } = openSeadragon);
    ({ displayRegion: osdNavDisplayRegion } = navigator);

    // Override some styles that OSD sets directly on the elements
    navigator.element.style.border = "none";
    navigator.element.parentElement.style.backgroundColor = "#666";

    Object.assign(osdNavDisplayRegion.style, {
      display: "block",
      border: "none",
      overflow: "visible",
      left: "0",
      width: "100%",
      backgroundColor: "rgba(255 255 255 / .6)",
      boxShadow: "0 0 4px var(--primary-accent)",
    });

    navigator.update = function navUpdate(mainViewport) {
      // reimplemented based on
      // https://github.com/openseadragon/openseadragon/blob/6cb2c9e7bc4adebe28e386a093890a6c3e353c6b/src/navigator.js#L342-L393

      const {
        viewport: navViewport,
        displayRegion: { style },
        totalBorderWidths,
      } = this;

      if (mainViewport && navViewport) {
        const bounds = viewport.getBoundsNoRotate(true);
        const topleft = navViewport.pixelFromPointNoRotate(
          bounds.getTopLeft(),
          false,
        );
        const bottomright = navViewport
          .pixelFromPointNoRotate(bounds.getBottomRight(), false)
          .minus(totalBorderWidths);

        style.top = `${Math.round(topleft.y)}px`;
        style.height = `${Math.abs(topleft.y - bottomright.y)}px`;
      }
    };

    openSeadragon.addOnceHandler("update-viewport", () => {
      createHolesOverlaySvg();
      advanceToTick(0);
    });
    openSeadragon.addHandler("pan", ({ immediately }) => {
      if (immediately) return;
      const viewportCenter = viewport.getCenter(false);
      const imgCenter = viewport.viewportToImageCoordinates(viewportCenter);
      skipToTick(
        scrollDownwards ? imgCenter.y - firstHolePx : firstHolePx - imgCenter.y,
      );
    });
    openSeadragon.addHandler("open", () => {
      const tiledImage = viewport.viewer.world.getItemAt(0);
      tiledImage.addOnceHandler(
        "fully-loaded-change",
        () => (rollImageReady = true),
      );
    });
    openSeadragon.addHandler("zoom", ({ zoom }) => {
      const imageZoom = viewport.viewportToImageZoom(zoom);
      trackerbarHeight = Math.max(1, avgHoleWidth * imageZoom);
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
  class:highlight-enabled-holes={$userSettings.highlightEnabledHoles}
  class:show-note-velocities={$userSettings.showNoteVelocities}
  class:use-roll-pedaling={$rollPedalingOnOff}
  class:play-expressions={$playExpressionsOnOff}
  style="--trackerbar-height: {trackerbarHeight}px"
>
  {#if !rollImageReady}
    <p transition:fade>Downloading roll image...</p>
  {/if}
  {#if showControls}
    <RollViewerControls
      {openSeadragon}
      {minZoomLevel}
      {maxZoomLevel}
      {panByIncrement}
    />
  {/if}
</div>

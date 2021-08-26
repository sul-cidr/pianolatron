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

    // tracker bar
    &::before {
      background: linear-gradient(
        180deg,
        var(--primary-accent-semiopaque) calc(50% - 1px),
        var(--primary-accent) 50%,
        var(--primary-accent-semiopaque) calc(50% + 1px)
      );
      content: "";
      display: block;
      height: var(--trackerbar-height);
      pointer-events: none;
      position: absolute;
      top: calc(50% - var(--trackerbar-height) / 2);
      width: calc(100% - var(--navigator-width));
      z-index: 1;
    }

    // overlay to mask white borders on the roll images
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
      transition: margin 0.5s ease;
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
    scrollDownwards,
    currentTick,
    userSettings,
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
  let animationEaseInterval;
  let osdNavDisplayRegion;

  const annotateHoleData = (holeData) => {
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
      $scrollDownwards ? offsetY - 4 : imageLength - offsetY - height - 4,
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
        $scrollDownwards
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

  // Pan the viewer to bring the position of `@tick` to the center of
  //  the viewport.  Does not trigger an OSD `pan` event.
  const updateViewportFromTick = (tick) => {
    if (!openSeadragon) return;
    const linePx = firstHolePx + ($scrollDownwards ? tick : -tick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    viewport.centerSpringY.springTo(lineViewport.y);

    osdNavDisplayRegion.dataset.label = ($playbackProgress * 100).toFixed(1);
    osdNavDisplayRegion.classList.toggle(
      "label-above",
      $scrollDownwards ? $playbackProgress > 0.5 : $playbackProgress < 0.5,
    );
  };

  // Updates the application position by an amount proportional to the
  //  current size of the viewport, in a direction specified by `@up`.
  // Pans the viewer only indirectly by virtue of updating `$currentTick`.
  const updateTickByViewportIncrement = (up = true) => {
    const viewportBounds = viewport.getBounds();
    const imgBounds = viewport.viewportToImageRectangle(viewportBounds);
    const delta = up ? -imgBounds.height / 200 : imgBounds.height / 200;
    const centerY = imgBounds.y + imgBounds.height / 2;
    skipToTick(
      $scrollDownwards
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

  // Updates the application position to reflect the current position of
  //  the viewport.
  // Pans the viewer only indirectly by virtue of updating `$currentTick`.
  // If `@animate` is passed, vertical panning is animated, but the
  //  `animationTime` for the OSD spring animation is reduced over time
  //  until it returns to zero (no animation).
  const updateTickFromViewport = (animate) => {
    clearInterval(animationEaseInterval);

    if (animate) {
      const { centerSpringY } = viewport;
      centerSpringY.animationTime = 1.2;

      animationEaseInterval = setInterval(() => {
        centerSpringY.animationTime = Math.max(
          centerSpringY.animationTime - 0.1,
          0,
        );
        if (centerSpringY.animationTime <= 0) {
          clearInterval(animationEaseInterval);
        }
      }, 100);
    }

    const viewportCenter = viewport.getCenter(false);
    const imgCenter = viewport.viewportToImageCoordinates(viewportCenter);
    skipToTick(
      $scrollDownwards
        ? clamp(
            imgCenter.y - firstHolePx,
            -firstHolePx,
            imageLength - firstHolePx,
          )
        : clamp(
            firstHolePx - imgCenter.y,
            firstHolePx - imageLength,
            firstHolePx,
          ),
    );
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
      gestureSettingsMouse: { clickToZoom: false, scrollToZoom: false },
      showNavigator: true,
      navigatorAutoFade: false,
      navigatorPosition: "ABSOLUTE",
      navigatorTop: "0px",
      navigatorLeft: "calc(100% - var(--navigator-width))",
      navigatorHeight: "100%",
      navigatorWidth: "var(--navigator-width)",
      navigatorDisplayRegionColor: "transparent",
      animationTime: 0,
    });

    const { navigator } = openSeadragon;
    ({ viewport } = openSeadragon);
    ({ displayRegion: osdNavDisplayRegion } = navigator);

    // Directly set some OSD internals that aren't exposed in the constructor
    viewport.zoomSpring.animationTime = 1.2;
    viewport.centerSpringX.animationTime = 1.2;
    viewport.centerSpringY.animationTime = 0;
    navigator.panHorizontal = false;

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

    // Monkey-patch the navigator.update method to prevent the displayRegion element
    //  being resized to reflect the horizontal dimension of the viewport
    navigator.update = (mainViewport) => {
      // reimplemented based on
      // https://github.com/openseadragon/openseadragon/blob/6cb2c9e7bc4adebe28e386a093890a6c3e353c6b/src/navigator.js#L342-L393

      const {
        viewport: navViewport,
        displayRegion: { style },
        totalBorderWidths,
      } = navigator;

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

    // OSD event handlers

    // on open, configure an event listener for when the images arrive
    //  from the SDR
    openSeadragon.addHandler("open", () => {
      const tiledImage = viewport.viewer.world.getItemAt(0);
      tiledImage.addOnceHandler(
        "fully-loaded-change",
        () => (rollImageReady = true),
      );
    });

    // create the holes overlay SVG and "rewind" to the beginning of the
    //  performance when the viewport updates for the first time
    openSeadragon.addOnceHandler("update-viewport", () => {
      createHolesOverlaySvg();
      updateViewportFromTick(0);
    });

    // update the height of the tracker bar when the zoom changes
    openSeadragon.addHandler("zoom", ({ zoom }) => {
      const imageZoom = viewport.viewportToImageZoom(zoom);
      trackerbarHeight = Math.max(1, avgHoleWidth * imageZoom);
    });

    // re-implement some default OSD interactions to apply our own constraints
    //  and sidestep some interaction effects
    openSeadragon.addHandler("canvas-drag", (event) => {
      event.preventDefaultAction = true;

      const center = new OpenSeadragon.Point(
        viewport.centerSpringX.target.value,
        viewport.centerSpringY.target.value,
      );

      const verticalBound = navigator.viewport.imageToViewportCoordinates(
        new OpenSeadragon.Point(0, imageLength),
      );

      const delta = viewport.deltaPointsFromPixels(event.delta.negate());

      viewport.centerSpringX.target.value += delta.x;
      if (viewport.getBounds().x !== viewport.getConstrainedBounds().x)
        delta.x = 0;

      const target = center.plus(delta);

      viewport.centerSpringX.springTo(target.x);
      viewport.centerSpringY.springTo(clamp(target.y, 0, verticalBound.y));

      updateTickFromViewport(/* animate = */ true);
    });

    openSeadragon.addHandler("navigator-click", (event) => {
      event.preventDefaultAction = true;
      if (!event.quick) return;
      const target = navigator.viewport.pointFromPixel(event.position);
      viewport.centerSpringY.springTo(target.y);
      updateTickFromViewport(/* animate = */ true);
    });

    openSeadragon.addHandler("navigator-drag", (event) => {
      event.preventDefaultAction = true;
      const center = new OpenSeadragon.Point(
        0,
        viewport.centerSpringY.target.value,
      );
      const target = center.plus(
        navigator.viewport.deltaPointsFromPixels(event.delta),
      );
      const verticalBound = navigator.viewport.imageToViewportCoordinates(
        new OpenSeadragon.Point(0, imageLength),
      );
      viewport.centerSpringY.springTo(clamp(target.y, 0, verticalBound.y));
      updateTickFromViewport(/* animate = */ false);
    });

    navigator.innerTracker.releaseHandler = () => {
      // The releaseHandler for navigator viewports is delegated to an
      //  `onCanvasRelease` function (see
      //  https://github.com/openseadragon/openseadragon/blob/master/src/navigator.js#L586-L590 )
      //  which calls viewport.applyConstraints() whether constraints are
      //  wanted or not.  Since that's literally all it does (and we don't want
      //  constraints applied here), we'll just neuter it here.
    };

    openSeadragon.open(imageUrl);
  });

  $: updateViewportFromTick($currentTick);
  $: highlightHoles($currentTick);
  $: annotateHoleData($rollMetadata.holeData);
  $: imageLength = parseInt($rollMetadata.IMAGE_LENGTH, 10);
  $: imageWidth = parseInt($rollMetadata.IMAGE_WIDTH, 10);
  $: avgHoleWidth = parseInt($rollMetadata.AVG_HOLE_WIDTH, 10);
  $: firstHolePx = $scrollDownwards
    ? parseInt($rollMetadata.FIRST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.FIRST_HOLE, 10);

  export { updateTickByViewportIncrement };
</script>

<div
  id="roll-viewer"
  on:mouseenter={() => (showControls = true)}
  on:mouseleave={() => (showControls = false)}
  on:wheel|capture|preventDefault={(event) => {
    if (event.ctrlKey) {
      updateTickByViewportIncrement(/* up = */ event.deltaY < 0);
      event.stopPropagation();
      return;
    }

    viewport.zoomTo(
      Math.min(
        viewport.getZoom() * (event.deltaY > 0 ? 0.9 : 1.1),
        maxZoomLevel,
      ),
    );
  }}
  class:active-note-details={$userSettings.activeNoteDetails}
  class:highlight-enabled-holes={$userSettings.highlightEnabledHoles}
  class:show-note-velocities={$userSettings.showNoteVelocities}
  class:use-roll-pedaling={$rollPedalingOnOff}
  class:play-expressions={$playExpressionsOnOff}
  style={`--trackerbar-height: ${trackerbarHeight}px;`}
>
  {#if !rollImageReady}
    <p transition:fade>Downloading roll image...</p>
  {/if}
  {#if showControls}
    <RollViewerControls
      {openSeadragon}
      {minZoomLevel}
      {maxZoomLevel}
      {updateTickByViewportIncrement}
    />
  {/if}
</div>

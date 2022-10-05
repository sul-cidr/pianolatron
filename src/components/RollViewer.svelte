<style lang="scss">
  // See styles/hole-highlighting.scss for all the <mark/> and <rect/> styling

  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

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

  .roll-loading {
    background: rgba(black, 0.4);
    border-radius: 4px;
    color: white;
    left: 1em;
    padding: 4px 8px;
    position: absolute;
    top: 1em;
    z-index: 1;
  }
</style>

<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import OpenSeadragon from "openseadragon";
  import {
    rollMetadata,
    scrollDownwards,
    currentTick,
    userSettings,
    playExpressionsOnOff,
    rollPedalingOnOff,
    playbackProgress,
    expressionizer,
    bassExpCurve,
    trebleExpCurve,
    expressionParameters,
    expressionCurvesOnOff,
    speedTicksPerSec,
  } from "../stores";
  import { clamp, getHoleLabel } from "../lib/utils";
  import RollViewerControls from "./RollViewerControls.svelte";
  import RollViewerScaleBar from "./RollViewerScaleBar.svelte";

  export let imageUrl;
  export let holeData;
  export let holesByTickInterval;
  export let skipToTick;

  const defaultZoomLevel = 1;
  const minZoomLevel = 0.1;
  const maxZoomLevel = 4;
  const horizontalPanIncrement = 40;

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
  let ppi;
  let svgPartitions;
  let visibleSvgs = [];
  let entireViewportRectangle;
  let expressionCurvesSvg;

  const createMark = (hole) => {
    const {
      x: offsetX,
      startY: offsetY,
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
      offsetY - 4,
      width + 11,
      height + 12,
    );
    viewport.viewer.addOverlay(mark, viewportRectangle);
    return mark;
  };

  const drawExpressionCurves = (bassExpC, trebleExpC, express, onOff) => {
    const drawGuidesAndCurve = (guides, expCurve, g, svg, transformation) => {
      for (let i = 0; i < expCurve.length - 1; i += 1) {
        const curveLine = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        curveLine.setAttribute(
          "style",
          "stroke:green;fill:none;stroke-width:2;",
        );
        curveLine.setAttribute("x1", expCurve[i][1]);
        curveLine.setAttribute("x2", expCurve[i + 1][1]);
        curveLine.setAttribute("y1", expCurve[i][0]);
        curveLine.setAttribute("y2", expCurve[i + 1][0]);
        curveLine.setAttribute("transform", transformation);
        g.appendChild(curveLine);

        Object.values(guides).forEach((value) => {
          const guideLine = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
          );
          guideLine.setAttribute(
            "style",
            "stroke:palegreen;fill:none;stroke-width:1;opacity:25%;",
          );
          guideLine.setAttribute("x1", value);
          guideLine.setAttribute("x2", value);
          guideLine.setAttribute("y1", expCurve[i][0]);
          guideLine.setAttribute("y2", expCurve[i + 1][0]);
          guideLine.setAttribute("transform", transformation);
          g.appendChild(guideLine);
        });
      }
    };

    if (viewport && expressionCurvesSvg !== undefined) {
      viewport.viewer.removeOverlay(expressionCurvesSvg);
    }

    if (
      viewport === undefined ||
      bassExpC == null ||
      bassExpC.length === 0 ||
      trebleExpC == null ||
      trebleExpC.length === 0 ||
      ["NONE", "FROM_MIDI"].includes(express) ||
      !onOff
    )
      return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.setAttribute("width", imageWidth);
    svg.setAttribute("height", imageLength);
    svg.setAttribute("viewBox", `0 0 ${imageWidth} ${imageLength}`);
    svg.setAttribute("style", "pointer-events: none;"); // needed?
    svg.appendChild(g);

    // Roll images are slightly offset to the right (sigh). This could be used
    // to compensate. But at present, it's just being used as a kluge to push
    // the expression curves closer to the center of the viewer
    const scanOffset = 150;
    const horizOffset = Math.round(imageWidth / 2);
    const curveRegionWidth = Math.round(imageWidth / 2);
    const horizScale = Math.round(curveRegionWidth / 127);
    const vertOffset = $scrollDownwards ? firstHolePx : firstHolePx;
    const vertScale = $scrollDownwards ? 1 : -1;
    const expParams = $expressionParameters;
    if (expParams === null) return;
    let guides = {};
    if (
      ["welte-red", "welte-green", "welte-licensee", "duo-art"].includes(
        $rollMetadata.ROLL_TYPE,
      )
    ) {
      // Sometimes this runs before $expressionMap updates (when changing
      // between roll types), meaning the guide overlay coords are NaNs.
      // Fortunately it runs again later after they've updated, ensuring the
      // overlays are drawn, but ideally it shouldn't happen this way.
      if (expParams === undefined || !("tunable" in expParams)) return;
      guides = {
        p: parseInt(expParams.tunable.welte_p, 10),
        mf: parseInt(expParams.tunable.welte_mf, 10),
        f: parseInt(expParams.tunable.welte_f, 10),
      };
    } else if ($rollMetadata.ROLL_TYPE === "88-note") {
      if (expParams === undefined || !("tunable" in expParams)) return;
      guides = {
        mf: parseInt(expParams.tunable.default_mf, 10),
        f: parseInt(expParams.tunable.accent_f, 10),
      };
    }
    drawGuidesAndCurve(
      guides,
      bassExpC,
      g,
      svg,
      `translate(${scanOffset} ${vertOffset}) scale(${horizScale} ${vertScale})`,
    );
    drawGuidesAndCurve(
      guides,
      trebleExpC,
      g,
      svg,
      `translate(${
        horizOffset * 2 - scanOffset
      } ${vertOffset}) scale(${-horizScale} ${vertScale})`,
    );

    expressionCurvesSvg = svg;
    viewport.viewer.addOverlay(svg, entireViewportRectangle);
  };

  const createHolesOverlaySvg = (holes) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const padding = 10;

    svg.setAttribute("width", imageWidth);
    svg.setAttribute("height", imageLength);
    svg.setAttribute("viewBox", `0 0 ${imageWidth} ${imageLength}`);
    svg.setAttribute("style", "pointer-events: none;");
    svg.appendChild(g);

    holes.forEach((hole) => {
      const {
        x: offsetX,
        startY: offsetY,
        w: width,
        h: height,
        color: holeColor,
        type: holeType,
      } = hole;

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );

      rect.setAttribute("x", offsetX - padding);
      rect.setAttribute("y", offsetY - padding);
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

    return svg;
  };

  const partitionHolesOverlaySvgs = () => {
    if (!holeData) return;

    entireViewportRectangle = viewport.imageToViewportRectangle(
      0,
      0,
      imageWidth,
      imageLength,
    );

    svgPartitions = new IntervalTree();

    const rangeLengthPx = 1000;

    // firstHolePx and lastHolePx reflect the temporal order of the holes, and
    //  so are top-to-bottom for $scrollDownwards rolls, and bottom-to-top for
    //  !$scrollDownwards rolls.
    const holesBeginPx = $scrollDownwards ? firstHolePx : lastHolePx;
    const holesEndPx = $scrollDownwards ? lastHolePx : firstHolePx;

    for (
      let rangeBeginsPx = holesBeginPx;
      rangeBeginsPx <= holesEndPx;
      rangeBeginsPx += rangeLengthPx
    ) {
      const rangeEndsPx = Math.min(rangeBeginsPx + rangeLengthPx, holesEndPx);

      const holes = holeData.filter(
        ({ startY }) => startY >= rangeBeginsPx && startY < rangeEndsPx,
      );

      if (holes.length) {
        const lastHoleEndsPx = Math.max(...holes.map(({ endY }) => endY));
        const svg = createHolesOverlaySvg(holes);
        svgPartitions.insert(rangeBeginsPx, lastHoleEndsPx, svg);
      }
    }
  };

  const updateVisibleSvgPartitions = () => {
    if (svgPartitions === undefined) return;

    const { y: firstImagePixel, height: viewportImageLength } =
      viewport.viewportToImageRectangle(viewport.getBounds());

    const lastImagePixel = firstImagePixel + viewportImageLength;
    const svgs = svgPartitions.search(firstImagePixel, lastImagePixel);

    // Remove any currently displayed SVG overlays that don't overlap with the
    // viewer window
    visibleSvgs = visibleSvgs.filter((visibleSvg) => {
      if (svgs.includes(visibleSvg)) return true;
      viewport.viewer.removeOverlay(visibleSvg);
      return false;
    });

    // Add SVG overlays that newly overlap with the viewer window
    svgs.forEach((svg) => {
      if (visibleSvgs.includes(svg)) return;
      visibleSvgs.push(svg);
      viewport.viewer.addOverlay(svg, entireViewportRectangle);
    });
  };

  const highlightHoles = (tick) => {
    if (!openSeadragon) return;

    const visTick =
      tick -
      ($userSettings.visDelayInMS * parseFloat($speedTicksPerSec)) / 1000.0;

    const holes = holesByTickInterval.search(visTick, visTick);

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

    const visTick =
      tick -
      ($userSettings.visDelayInMS * parseFloat($speedTicksPerSec)) / 1000.0;

    const linePx = firstHolePx + ($scrollDownwards ? visTick : -visTick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    viewport.centerSpringY.springTo(lineViewport.y);

    osdNavDisplayRegion.dataset.label = ($playbackProgress * 100).toFixed(1);
    osdNavDisplayRegion.classList.toggle(
      "label-above",
      $scrollDownwards ? $playbackProgress > 0.5 : $playbackProgress < 0.5,
    );

    updateVisibleSvgPartitions();
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

  const panHorizontal = (left = true) => {
    viewport.panBy(
      viewport.deltaPointsFromPixels(
        new OpenSeadragon.Point(
          left ? -horizontalPanIncrement : horizontalPanIncrement,
          0,
        ),
      ),
    );
    viewport.applyConstraints();
  };

  const centerRoll = () => {
    const viewportBounds = viewport.getBounds();
    const lineCenter = new OpenSeadragon.Point(
      0.5,
      viewportBounds.y + viewportBounds.height / 2,
    );
    viewport.panTo(lineCenter);
  };

  const adjustZoom = (action = "zoomIn") => {
    if (action === "zoomIn") {
      viewport.zoomTo(Math.min(viewport.getZoom() * 1.1, maxZoomLevel));
    } else if (action === "zoomOut") {
      viewport.zoomTo(Math.max(viewport.getZoom() * 0.9, minZoomLevel));
    } else if (action === "resetZoom") {
      viewport.zoomTo(1);
      centerRoll();
    }
  };

  onMount(() => {
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
      partitionHolesOverlaySvgs();
      drawExpressionCurves(
        $bassExpCurve,
        $trebleExpCurve,
        $expressionizer,
        $expressionCurvesOnOff,
      );
      updateViewportFromTick(0);
    });

    // update the height of the tracker bar and the PPI value passed to
    //  <RollViewerScaleBar/> when the zoom changes
    openSeadragon.addHandler("zoom", ({ zoom }) => {
      const imageZoom = viewport.viewportToImageZoom(zoom);
      trackerbarHeight = Math.max(1, avgHoleWidth * imageZoom);
      ppi = imageZoom * 300;
      updateVisibleSvgPartitions();
    });

    // disable OSD's own keyboard interactions
    viewport.viewer.addHandler("canvas-key", (event) => {
      event.preventDefaultAction = true;
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
  $: drawExpressionCurves(
    $bassExpCurve,
    $trebleExpCurve,
    $expressionizer,
    $expressionCurvesOnOff,
  );
  $: imageLength = parseInt($rollMetadata.IMAGE_LENGTH, 10);
  $: imageWidth = parseInt($rollMetadata.IMAGE_WIDTH, 10);
  $: avgHoleWidth = parseInt($rollMetadata.AVG_HOLE_WIDTH, 10);
  $: firstHolePx = $scrollDownwards
    ? parseInt($rollMetadata.FIRST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.FIRST_HOLE, 10);
  $: lastHolePx = $scrollDownwards
    ? parseInt($rollMetadata.LAST_HOLE, 10)
    : parseInt($rollMetadata.IMAGE_LENGTH, 10) -
      parseInt($rollMetadata.LAST_HOLE, 10);

  export {
    adjustZoom,
    updateTickByViewportIncrement,
    panHorizontal,
    partitionHolesOverlaySvgs,
    updateVisibleSvgPartitions,
  };
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
      clamp(
        viewport.getZoom() * (event.deltaY > 0 ? 0.9 : 1.1),
        minZoomLevel,
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
    <span class="roll-loading" transition:fade>Downloading roll image...</span>
  {:else}
    <RollViewerScaleBar {ppi} />
  {/if}
  {#if showControls}
    <RollViewerControls
      {openSeadragon}
      {minZoomLevel}
      {maxZoomLevel}
      {updateTickByViewportIncrement}
      {panHorizontal}
      {adjustZoom}
    />
  {/if}
</div>

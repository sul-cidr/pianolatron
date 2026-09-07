<svelte:options accessors />

<style lang="scss">
  @use "src/styles/sass-globals.scss" as *;
  // See styles/hole-highlighting.scss for all the <mark/> and <rect/> styling

  #roll-viewer {
    position: relative;
    height: 100%;
    width: 100%;

    :global(#nav-display-start-marker) {
      height: var(--nav-bar-height);
      background: red !important;
      display: "block";
      position: relative;
    }

    :global(#nav-display-end-marker) {
      height: var(--nav-bar-height);
      background: blue !important;
      display: "block";
      position: relative;
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
      z-index: 3;
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
      box-shadow: inset 0px 0px 3px 0px rgba(0, 0, 0, 0.4);
    }

    :global(canvas) {
      background: white !important;
    }

    #active-note-highlight-canvas {
      background: transparent !important;
      height: 100%;
      left: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      width: calc(100% - var(--navigator-width));
      z-index: 2;
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
      opacity: 0.6;
    }

    :global(.displayregion.label-above::after) {
      margin-top: -100%;
      top: 0;
    }

    &:hover :global(.overlay-buttons) {
      opacity: 1;
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
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import OpenSeadragon from "openseadragon";
  import {
    avgHoleWidth,
    bassExpCurve,
    drawVelocityCurves,
    expressionParameters,
    firstHolePx,
    holesIntervalTree,
    imageLength,
    imageWidth,
    lastHolePx,
    playbackProgress,
    playbackProgressStart,
    playbackProgressEnd,
    latencyDetected,
    showLatencyWarning,
    throttledTick,
    transposeHalfStep,
    playExpressionsOnOff,
    rollMetadata,
    rollPedalingOnOff,
    scrollDownwards,
    trebleExpCurve,
    useInAppExpression,
    userSettings,
  } from "../stores";
  import { rollProfile } from "../config/roll-config";
  import { clamp, defaultHoleColor, getHoleLabel } from "../lib/utils";
  import RollViewerControls from "./RollViewerControls.svelte";
  import RollViewerScaleBar from "./RollViewerScaleBar.svelte";
  import AriaAnnouncer from "../ui-components/AriaAnnouncer.svelte";
  import LatencyWarning from "../ui-components/LatencyWarning.svelte";
  import SkipLink from "../ui-components/SkipLink.svelte";

  export let showScaleBar = true;
  export let imageUrl;
  export let skipToTick;
  export let rollImageReady;
  export let progressPercentageToTick;

  const defaultZoomLevel = 1;
  const minZoomLevel = 0.1;
  const maxZoomLevel = 4;
  const horizontalPanIncrement = 40;

  let _updateViewportHandler;
  let announcement;
  let openSeadragon;
  let viewport;
  let marks = [];
  let hoveredMark;
  let trackerbarHeight;
  let animationEaseInterval;
  let osdNavDisplayRegion;
  let ppi;
  let holesSvgPartitions;
  let visibleHolesSvgs = [];
  let expressionSvgPartitions;
  let visibleExpressionSvgs = [];
  let entireViewportRectangle;

  let selectionSvg;
  let navSelectionSvg;
  let highlightCanvas;
  let highlightCtx = null;
  const _highlightActivation = new WeakMap();

  const getHoleDescription = (hole) => {
    let holeLabel = hole.label;
    let velocity = "";

    // We only want to transpose notes, not ALL midi keys.
    if (hole.type === "note") {
      holeLabel = getHoleLabel(
        hole.m + $transposeHalfStep,
        $rollMetadata.ROLL_TYPE,
      );

      // Use the specified note spelling from the roll .json file, if available
      if ($transposeHalfStep === 0 && hole.s !== undefined) {
        const octave = holeLabel.match(/\d/)[0];
        // The actual ♯ symbol looks weird when rendered in a hole label
        const noteName = hole.s.replace("-", "♭").replace("+", "♯");
        holeLabel = `${noteName}${octave}`;
      }

      if ($userSettings.showNoteVelocities) {
        velocity = Math.round(
          $playExpressionsOnOff ? (hole.v ?? 64) : 64,
        ).toString();
      }
    }

    return [holeLabel, velocity];
  };

  const createMark = (hole) => {
    const {
      x: offsetX,
      startY: offsetY,
      w: width,
      h: height,
      type: holeType,
    } = hole;

    const mark = document.createElement("mark");

    const [holeLabel, velocity] = getHoleDescription(hole);
    mark.dataset.holeLabel = holeLabel;
    mark.dataset.noteVelocity = velocity || 64;

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

    mark.classList.toggle("flag-bottom", !$scrollDownwards);

    const viewportRectangle = viewport.imageToViewportRectangle(
      offsetX - 4,
      offsetY - 4,
      width + 11,
      height + 12,
    );
    viewport.viewer.addOverlay(mark, viewportRectangle);
    return mark;
  };

  // Adds an overlay that shows user selection in the roll viewer.
  // If start and end markers are set, a rect is added to show the selected section.
  const createSelectionOverlaySvg = (startPx, endPx, overlayConfig) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (overlayConfig.viewBox) {
      svg.setAttribute("viewBox", overlayConfig.viewBox);
    }
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    svg.setAttribute("width", overlayConfig.lineWidth);
    svg.setAttribute("height", "100%");
    svg.setAttribute("style", "pointer-events: none;");
    svg.appendChild(g);

    // start line
    if (startPx >= 0) {
      const startLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      startLine.setAttribute("x1", 0);
      startLine.setAttribute("y1", startPx);
      startLine.setAttribute("x2", overlayConfig.lineWidth);
      startLine.setAttribute("y2", startPx);
      startLine.setAttribute("stroke", "darkolivegreen");
      startLine.setAttribute("stroke-width", overlayConfig.strokeWidth);
      startLine.setAttribute("stroke-opacity", overlayConfig.strokeOpacity);
      g.appendChild(startLine);
    }

    // end line
    if (endPx >= 0) {
      const endLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      endLine.setAttribute("x1", 0);
      endLine.setAttribute("y1", endPx);
      endLine.setAttribute("x2", overlayConfig.lineWidth);
      endLine.setAttribute("y2", endPx);
      endLine.setAttribute("stroke", "steelblue");
      endLine.setAttribute("stroke-width", overlayConfig.strokeWidth);
      endLine.setAttribute("stroke-opacity", overlayConfig.strokeOpacity);
      g.appendChild(endLine);
    }

    // and in between
    if (startPx >= 0 && endPx >= 0) {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );

      const height = $scrollDownwards ? endPx - startPx : startPx - endPx;
      const boxStart = $scrollDownwards ? startPx : endPx;

      rect.setAttribute("x", 0);
      rect.setAttribute("y", boxStart);
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", height);
      rect.setAttribute("fill", `hsla(304, 97%, 58%, 0.26)`);
      rect.setAttribute("class", "selection");
      g.appendChild(rect);
    }

    return svg;
  };

  // Take a Y value in the image and return a Y coordinate in the Nav viewer
  //  that we can draw a line with.
  const imagePxToNavLine = (imagePx) => {
    // below 0 means there is no selection.
    if (imagePx < 0) {
      return -1;
    }
    const lineViewport = viewport.imageToViewportCoordinates(0, imagePx);
    const lineNav = openSeadragon.navigator.viewport.pixelFromPointNoRotate(
      lineViewport,
      false,
    );
    return lineNav.y;
  };

  // Some UI configuration for the selection overlays. There is some minor
  //  variance between the image roll and the nav strip.
  const getSelectionConfig = (isNav = false) => ({
    lineWidth: isNav ? "50" : $imageWidth,
    viewBox: isNav ? null : `0 0 ${$imageWidth} ${$imageLength}`,
    strokeWidth: isNav ? 2 : 20,
    strokeOpacity: isNav ? "100%" : "50%",
  });

  // Selection Overlay in the image viewer
  const updateSelectionOverlays = () => {
    if (viewport === undefined) {
      return;
    }

    let startLinePx = -1;
    let endLinePx = -1;

    if ($playbackProgressStart >= 0) {
      const startTick = progressPercentageToTick($playbackProgressStart);
      startLinePx = $firstHolePx + ($scrollDownwards ? startTick : -startTick);
    }

    if ($playbackProgressEnd < 1) {
      const endTick = progressPercentageToTick($playbackProgressEnd);
      endLinePx = $firstHolePx + ($scrollDownwards ? endTick : -endTick);
    }

    // Remove any existing overlays from the roll viewer and navigator strip
    if (selectionSvg !== undefined) viewport.viewer.removeOverlay(selectionSvg);
    openSeadragon.navigator.clearOverlays();

    // This can happen at init time
    if (startLinePx === -1 && endLinePx === -1) return;

    const navBarLineConfig = [
      imagePxToNavLine(startLinePx),
      imagePxToNavLine(endLinePx),
      getSelectionConfig(true),
    ];
    navSelectionSvg = createSelectionOverlaySvg(...navBarLineConfig);
    openSeadragon.navigator.addOverlay(
      navSelectionSvg,
      OpenSeadragon.Point(0, 0),
      OpenSeadragon.Placement.TOP,
    );

    const selectionConfig = getSelectionConfig();
    selectionSvg = createSelectionOverlaySvg(
      startLinePx,
      endLinePx,
      selectionConfig,
    );
    viewport.viewer.addOverlay(selectionSvg, entireViewportRectangle);
  };

  const updateVisibleSvgPartitions = (svgPartitions, visiblePartitions) => {
    if (
      viewport === undefined ||
      viewport.viewer === undefined ||
      svgPartitions === undefined
    )
      return visiblePartitions;

    const {
      x: leftImagePixel,
      y: firstImagePixel,
      width: viewport$imageWidth,
      height: viewport$imageLength,
    } = viewport.viewportToImageRectangle(viewport.getBounds());

    const lastImagePixel = firstImagePixel + viewport$imageLength;
    const rightImagePixel = leftImagePixel + viewport$imageWidth;
    const overlappingPartitions = svgPartitions.search(
      firstImagePixel,
      lastImagePixel,
    );

    // Remove any currently displayed SVG overlay partitions that don't overlap
    //  with the viewer window, and make a note of those that do overlap
    let partitionsToShow = visiblePartitions.filter((visibleSvg) => {
      if (overlappingPartitions.includes(visibleSvg)) return true;
      viewport.viewer.removeOverlay(visibleSvg.svg);
      return false;
    });

    let persistingPartitions = [];
    let partitionsToAdd = [];

    // For SVG overlays that now overlap with the viewer window, mark as
    //  keyboard focusable only those hole rectangles that are fully visible
    overlappingPartitions.forEach((visibleSvgPartition) => {
      visibleSvgPartition.svg
        .querySelector("g")
        ?.querySelectorAll("rect")
        ?.forEach((rect) => {
          const rectXMin = parseInt(rect.getAttribute("x"));
          const rectXMax = rectXMin + parseInt(rect.getAttribute("width"));
          const rectYMin = parseInt(rect.getAttribute("y"));
          const rectYMax = rectYMin + parseInt(rect.getAttribute("height"));
          if (
            $userSettings.keyboardFocusHoles &&
            rectXMin >= leftImagePixel &&
            rectXMax <= rightImagePixel &&
            rectYMin >= firstImagePixel &&
            rectYMax <= lastImagePixel
          ) {
            rect.setAttribute("tabindex", "0");
          } else {
            rect.setAttribute("tabindex", "-1");
          }
        });

      // Keep track of overlays that will remain, because we may need to remove
      //  them temporarily to make sure the overlays remain in order
      if (partitionsToShow.includes(visibleSvgPartition)) {
        persistingPartitions.push(visibleSvgPartition);
        return;
      }
      partitionsToAdd.push(visibleSvgPartition);
      partitionsToShow.push(visibleSvgPartition);
    });

    // Check whether the persisting overlays and those to be newly added to the
    //  DOM are in ascending order by first image pixel - this may not be the
    //  case if the user is scrolling backwards
    const alreadySorted = partitionsToShow.every(
      (currentPartition, idx, allPartitions) => {
        if (idx === allPartitions.length - 1) return true;
        return currentPartition.first <= allPartitions[idx + 1].first;
      },
    );

    // If the partitions would be out of order if the new entries are added
    //  naively, remove all persisting partitions from the viewer and determine
    //  the proper order
    if (!alreadySorted) {
      persistingPartitions.forEach((svgPartition) =>
        viewport.viewer.removeOverlay(svgPartition.svg),
      );
      partitionsToShow.sort((a, b) => (a.first <= b.first ? -1 : 1));
      partitionsToAdd = partitionsToShow;
    }

    // Add the partitions to be displayed, in the proper order
    partitionsToShow.forEach((svgPartition) => {
      if (partitionsToAdd.includes(svgPartition))
        viewport.viewer.addOverlay(svgPartition.svg, entireViewportRectangle);
    });

    return partitionsToShow;
  };

  const updateVisibleOverlays = () => {
    visibleHolesSvgs = updateVisibleSvgPartitions(
      holesSvgPartitions,
      visibleHolesSvgs,
    );
    visibleExpressionSvgs = updateVisibleSvgPartitions(
      expressionSvgPartitions,
      visibleExpressionSvgs,
    );
  };

  const partitionExpressionOverlaySvgs = (bassExpC, trebleExpC) => {
    if (!viewport) return;

    const partitionGuidesAndCurve = (
      guides,
      expCurve,
      transformation,
      vertScale,
    ) => {
      let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", $imageWidth);
      svg.setAttribute("height", $imageLength);
      svg.setAttribute("viewBox", `0 0 ${$imageWidth} ${$imageLength}`);
      svg.setAttribute("style", "pointer-events: none;");

      let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svg.appendChild(g);

      let rangeStartPx = null;
      let rangeEndPx = null;
      const rangeLengthPx = 1000;
      let rangeStart = null;
      let rangeEnd = null;

      for (let i = 0; i < expCurve.length; i += 1) {
        // The start of the vertical pixel range of each partition of curve and
        //  guide elements will be greater than the end of the range for rolls
        //  that scroll downwards, hence the abs and min/max checks below.
        if (
          Math.abs(rangeEndPx - rangeStartPx) > rangeLengthPx ||
          i === expCurve.length - 1
        ) {
          const guideValues = Object.values(guides);
          for (let j = 0; j < guideValues.length; j += 1) {
            const guideLine = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line",
            );
            guideLine.setAttribute(
              "style",
              "stroke:palegreen;fill:none;stroke-width:1;opacity:25%;",
            );
            guideLine.setAttribute("x1", guideValues[j]);
            guideLine.setAttribute("x2", guideValues[j]);
            guideLine.setAttribute("y1", rangeStart);
            guideLine.setAttribute("y2", rangeEnd);
            guideLine.setAttribute("transform", transformation);

            g.appendChild(guideLine);
          }

          expressionSvgPartitions.insert(
            Math.min(rangeStartPx, rangeEndPx),
            Math.max(rangeStartPx, rangeEndPx),
            {
              first: Math.min(rangeStartPx, rangeEndPx),
              last: Math.max(rangeStartPx, rangeEndPx),
              svg: svg,
            },
          );

          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("width", $imageWidth);
          svg.setAttribute("height", $imageLength);
          svg.setAttribute("viewBox", `0 0 ${$imageWidth} ${$imageLength}`);
          svg.setAttribute("style", "pointer-events: none;");
          g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          svg.appendChild(g);

          rangeStartPx = null;

          rangeStart = null;
        }

        // The final partition is usually shorter than rangeLengthPx; stop
        //  after drawing it.
        if (i === expCurve.length - 1) break;

        const curveStart = expCurve[i][0];
        const curveEnd = expCurve[i + 1][0];

        // Apply the same transformations as are applied to the SVG (y dim
        //  only) to get the correct pixel positions of the curve elements
        const curveStartPx = curveStart * vertScale + $firstHolePx;
        const curveEndPx = curveEnd * vertScale + $firstHolePx;

        if (rangeStartPx === null) {
          rangeStartPx = curveStartPx;
          rangeStart = curveStart;
        }
        rangeStart = Math.min(rangeStart, curveStart);
        rangeEnd = Math.max(rangeEnd, curveEnd);

        rangeEndPx = curveEndPx;

        // Each expression emulation "curve" is a series of connected segments,
        //  and the end point of one segment is usually identical to the start
        //  point of the next. This results in many zero-length point segments
        //  between the "real" segments; the former don't need to be drawn.
        if (expCurve[i][1] !== expCurve[i + 1][1] || curveStart !== curveEnd) {
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
          curveLine.setAttribute("y1", curveStart);
          curveLine.setAttribute("y2", curveEnd);
          curveLine.setAttribute("transform", transformation);
          g.appendChild(curveLine);
        }
      }
    };

    expressionSvgPartitions = new IntervalTree();

    if (
      !$drawVelocityCurves ||
      !$useInAppExpression ||
      !bassExpC ||
      bassExpC.length === 0 ||
      !trebleExpC ||
      trebleExpC.length === 0
    ) {
      updateVisibleOverlays(); // This removes any previously visible curves
      return;
    }

    // Roll images are slightly offset to the right (sigh). This could be used
    //  to compensate. But at present, it's just being used as a kluge to push
    //  the expression curves closer to the center of the viewer
    const scanOffset = 150;
    const horizOffset = Math.round($imageWidth / 2);
    const curveRegionWidth = Math.round($imageWidth / 2);
    const horizScale = Math.round(curveRegionWidth / 127);
    const vertScale = $scrollDownwards ? 1 : -1;
    const expParams = $expressionParameters;
    if (!expParams || !("tunable" in expParams)) return;
    let guides = {};
    if (
      ["welte-red", "welte-green", "welte-licensee", "duo-art"].includes(
        $rollMetadata.ROLL_TYPE,
      )
    ) {
      // Sometimes this runs before $expressionMap updates (when changing
      //  between roll types), meaning the guide overlay coords are NaNs.
      //  Fortunately it runs again later after they've updated, ensuring the
      //  overlays are drawn, but ideally it shouldn't happen this way.
      guides = {
        p: parseInt(expParams.tunable.welte_p.value, 10),
        mf: parseInt(expParams.tunable.welte_mf.value, 10),
        f: parseInt(expParams.tunable.welte_f.value, 10),
      };
    } else if ($rollMetadata.ROLL_TYPE === "88-note") {
      guides = {
        mf: parseInt(expParams.tunable.default_mf.value, 10),
        f: parseInt(expParams.tunable.accent_f.value, 10),
      };
    }
    partitionGuidesAndCurve(
      guides,
      bassExpC,
      `translate(${scanOffset} ${$firstHolePx}) scale(${horizScale} ${vertScale})`,
      vertScale,
    );
    partitionGuidesAndCurve(
      guides,
      trebleExpC,
      `translate(${
        horizOffset * 2 - scanOffset
      } ${$firstHolePx}) scale(${-horizScale} ${vertScale})`,
      vertScale,
    );

    updateVisibleOverlays();
  };

  const createHolesOverlaySvg = (holes) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const padding = 10;

    svg.setAttribute("width", $imageWidth);
    svg.setAttribute("height", $imageLength);
    svg.setAttribute("viewBox", `0 0 ${$imageWidth} ${$imageLength}`);
    svg.setAttribute("style", "pointer-events: none;");
    svg.appendChild(g);

    holes.sort((a, b) => {
      if (a.startY < b.startY) {
        return -1;
      } else if (a.startY > b.startY) {
        return 1;
      } else if (a.startY == b.startY && a.x < b.x) {
        return -1;
      } else if (a.startY == b.startY && a.x > b.x) {
        return 1;
      }
      return 0;
    });

    holes.forEach((hole) => {
      const {
        x: offsetX,
        startY: offsetY,
        endY: offsetYEnd,
        w: width,
        h: height,
        color: holeColor,
        type: holeType,
        m: midi,
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
      rect.setAttribute("fill", `hsla(${holeColor}, 0.8)`);
      rect.setAttribute("class", holeType);

      const [holeLabel, velocity] = getHoleDescription(hole);
      const holeName = holeLabel
        .replace("♯", " sharp ")
        .replace("A♭", "A-flat ")
        .replace("♭", " flat ")
        .replace("A#", "A-sharp ")
        .replace("#", " sharp ")
        .replace("_", " ")
        .replace("sust", "sustain");
      const holeColumn =
        midi - rollProfile[$rollMetadata.ROLL_TYPE].bassCtrlBegin;
      const holeLength = Math.round(((offsetYEnd - offsetY) / 300) * 100) / 100;
      const holeProgress = Math.round(
        ($scrollDownwards
          ? offsetY / $lastHolePx
          : ($firstHolePx - offsetY) / $firstHolePx) * 100,
      );
      const holeDescription = `${hole.type} hole ${holeName} in column \
      ${holeColumn} at ${holeProgress}% from roll start length ${holeLength} inches\
      ${$playExpressionsOnOff && velocity ? `velocity ${velocity}` : ""}`;

      const initializeMark = (hole) => {
        if (marks.map(([_hole]) => _hole).includes(hole)) return;
        viewport.viewer.removeOverlay(hoveredMark);
        hoveredMark = createMark(hole);
      };

      rect.addEventListener("mouseover", () => {
        announcement = holeDescription;
        initializeMark(hole);
      });

      rect.addEventListener("focus", (e) => {
        if (!$userSettings.keyboardFocusHoles) return;
        if (viewport.getZoom() < 1) adjustZoom("resetZoom");
        const holeAriaLabel = holeDescription;
        rect.setAttribute("aria-label", holeAriaLabel);
        initializeMark(hole);
        hoveredMark.classList.add("focus");
      });
      g.appendChild(rect);
    });

    return svg;
  };

  const partitionHolesOverlaySvgs = () => {
    if (!viewport || !$holesIntervalTree?.count) return;

    entireViewportRectangle = viewport.imageToViewportRectangle(
      0,
      0,
      $imageWidth,
      $imageLength,
    );

    holesSvgPartitions = new IntervalTree();

    const rangeLengthPx = 1000;

    // $firstHolePx and $lastHolePx reflect the temporal order of the holes, and
    //  so are top-to-bottom for $scrollDownwards rolls, and bottom-to-top for
    //  !$scrollDownwards rolls.
    const holesBeginPx = $scrollDownwards ? $firstHolePx : 0;
    const holesEndPx = $scrollDownwards ? $lastHolePx : $firstHolePx;

    for (
      let rangeBeginsPx = holesBeginPx;
      rangeBeginsPx <= holesEndPx;
      rangeBeginsPx += rangeLengthPx
    ) {
      const rangeEndsPx = Math.min(rangeBeginsPx + rangeLengthPx, holesEndPx);

      const searchStart = $scrollDownwards
        ? rangeBeginsPx - $firstHolePx
        : rangeBeginsPx;
      const searchEnd = $scrollDownwards
        ? rangeEndsPx - $firstHolePx
        : rangeEndsPx;

      const filterStartY = $scrollDownwards
        ? rangeBeginsPx
        : holesEndPx - rangeEndsPx;
      const filterEndY = $scrollDownwards
        ? rangeEndsPx
        : holesEndPx - rangeBeginsPx;

      const holes = $holesIntervalTree
        .search(searchStart, searchEnd)
        .filter(({ startY }) => startY >= filterStartY && startY < filterEndY);

      if (holes.length) {
        const firstHoleBeginsPx = Math.min(
          ...holes.map(({ startY }) => startY),
        );
        const lastHoleEndsPx = Math.max(...holes.map(({ endY }) => endY));
        const svg = createHolesOverlaySvg(holes);

        holesSvgPartitions.insert(firstHoleBeginsPx, lastHoleEndsPx, {
          first: firstHoleBeginsPx,
          last: lastHoleEndsPx,
          svg: svg,
        });
      }
    }
  };

  // Draw active note highlights on canvas instead of as DOM elements.
  const drawActiveHighlights = (tick) => {
    if (!highlightCtx || !openSeadragon) return;

    const holes = $holesIntervalTree.search(tick, tick);
    if (!holes.length) {
      highlightCtx.clearRect(
        0,
        0,
        highlightCanvas.width,
        highlightCanvas.height,
      );
      return;
    }

    const bounds = viewport.getBoundsNoRotate(true);
    const imgBounds = viewport.viewportToImageRectangle(bounds);
    const viewerSize = viewport.getContainerSize();

    // Clear and draw highlights for active holes
    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    holes.forEach((hole) => {
      // Skip pedal/control holes when pedaling or expression is off
      if (hole.type === "pedal" && !$rollPedalingOnOff) return;
      if (hole.type === "control" && !$playExpressionsOnOff) return;

      // Get highlight color: If base rect shaded, it's always yellow (default)
      //  If no base shade: blue<->red for notes unless expression is disabled,
      //  orange for pedals, green for control holes
      let color = defaultHoleColor;
      if (!$userSettings.highlightEnabledHoles) {
        color = hole.color;
        if (hole.type === "note" && !$playExpressionsOnOff)
          color = defaultHoleColor;
      }

      const holeX = hole.x;
      const holeY = hole.startY;
      const holeW = hole.w;
      const holeH = hole.h;

      // Convert image coords to screen pixel coords on the canvas
      const screenX = ((holeX - imgBounds.x) / imgBounds.width) * viewerSize.x;
      const screenY = ((holeY - imgBounds.y) / imgBounds.height) * viewerSize.y;
      const screenW = (holeW / imgBounds.width) * viewerSize.x;
      const screenH = (holeH / imgBounds.height) * viewerSize.y;

      // Animate highlight: bright "attack" then fade to steady opacity over 500ms
      let opacity = 0.6;
      let glow = 8;
      if (!_highlightActivation.has(hole)) {
        _highlightActivation.set(hole, performance.now());
      }
      const elapsed = performance.now() - _highlightActivation.get(hole);
      if (elapsed < 500) {
        const t = elapsed / 500;
        const eased = easeInOutCubic(t);
        opacity = 1 - 0.4 * eased;
        glow = 8 * (1 - eased);
      }

      highlightCtx.save();
      highlightCtx.shadowColor = `hsla(${color}, ${opacity * 0.5})`;
      highlightCtx.shadowBlur = glow;
      highlightCtx.fillStyle = `hsla(${color}, ${opacity})`;
      highlightCtx.beginPath();
      const radius = Math.min(6, screenW / 4, screenH / 4);
      highlightCtx.roundRect(screenX, screenY, screenW, screenH, radius);
      highlightCtx.fill();
      highlightCtx.restore();

      // Draw detail label on canvas when active-note-details is enabled
      if ($userSettings.activeNoteDetails) {
        const [holeLabel, velocity] = getHoleDescription(hole);
        const velocityLine = velocity ? `v:${velocity}` : "";

        highlightCtx.save();
        highlightCtx.textAlign = "center";

        const cx = screenX + screenW / 2;
        if (!$scrollDownwards) {
          drawTextLine(
            highlightCtx,
            holeLabel,
            true,
            cx,
            screenY + screenH + 28,
          );
          if (velocityLine) {
            drawTextLine(
              highlightCtx,
              velocityLine,
              false,
              cx,
              screenY + screenH + 50,
            );
          }
        } else {
          if (velocityLine) {
            drawTextLine(highlightCtx, holeLabel, true, cx, screenY - 36);
            drawTextLine(highlightCtx, velocityLine, false, cx, screenY - 14);
          } else {
            drawTextLine(highlightCtx, holeLabel, true, cx, screenY - 14);
          }
        }
        highlightCtx.restore();
      }
    });
  };

  const drawTextLine = (ctx, text, bold, x, y) => {
    ctx.font = bold ? "bold 18px sans-serif" : "16px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
  };

  // cribbed from https://github.com/gre/bezier-easing
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // remove the current highlights and re-add them. Needed for when a transpose has taken place
  const rehighlightHoles = (tick) => {
    drawActiveHighlights(-1);
    drawActiveHighlights(tick);
  };

  // Pan the viewer to bring the position of `@tick` to the center of
  //  the viewport. Does not trigger an OSD `pan` event, except when rewinding
  //  to tick 0.
  const updateViewportFromTick = (tick) => {
    if (!openSeadragon) return;

    if (tick === 0) {
      updateTickFromViewport(
        /* animate = */ true,
        /* targetY = */ $firstHolePx,
      );
    }

    const linePx = $firstHolePx + ($scrollDownwards ? tick : -tick);
    const lineViewport = viewport.imageToViewportCoordinates(0, linePx);

    viewport.centerSpringY.springTo(lineViewport.y);

    osdNavDisplayRegion.dataset.label = ($playbackProgress * 100).toFixed(1);
    osdNavDisplayRegion.classList.toggle(
      "label-above",
      $scrollDownwards ? $playbackProgress > 0.5 : $playbackProgress < 0.5,
    );

    updateVisibleOverlays();
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
            centerY + delta - $firstHolePx,
            -$firstHolePx,
            $imageLength - $firstHolePx,
          )
        : clamp(
            $firstHolePx - centerY - delta,
            $firstHolePx - $imageLength,
            $firstHolePx,
          ),
    );
  };

  // Updates the application position to reflect the current position of
  //  the viewport, or optionally, to jump to a specified Y coord.
  // Pans the viewer only indirectly by virtue of updating `$currentTick`.
  // If `@animate` is passed, vertical panning is animated, but the
  //  `animationTime` for the OSD spring animation is reduced over time
  //  until it returns to zero (no animation).
  const updateTickFromViewport = (animate, targetY) => {
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
          centerSpringY.animationTime = 0;
        }
      }, 100);
    }

    // If no targetY coordinate is provided, use the current viewport's center
    if (!targetY) {
      const viewportCenter = viewport.getCenter(false);
      const imgCenter = viewport.viewportToImageCoordinates(viewportCenter);
      targetY = imgCenter.y;
    }

    // Update the application to the tick represented by the targetY coordinate
    skipToTick(
      $scrollDownwards
        ? clamp(
            targetY - $firstHolePx,
            -$firstHolePx,
            $imageLength - $firstHolePx,
          )
        : clamp(
            $firstHolePx - targetY,
            $firstHolePx - $imageLength,
            $firstHolePx,
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
    // Make sure the roll metadata is available before proceeding
    if (!$rollMetadata) return;

    if ($userSettings.hideRollImage) {
      const canvas = document.createElement("canvas");
      canvas.width = $imageWidth;
      canvas.height = $imageWidth;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#00000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      imageUrl = canvas.toDataURL("image/png");
    }

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
      navigatorMaintainSizeRatio: true,
      tabIndex: -1, // omit from tab order
      tileSources: {
        type: "image",
        url: imageUrl,
      },
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
        element: navElement,
      } = navigator;

      if (mainViewport && navViewport) {
        const bounds = viewport.getBoundsNoRotate(true);
        const imgBounds = viewport.viewportToImageRectangle(
          viewport.getBounds(),
        );

        // Need to use navElement.clientHeight here because navViewport.getContainerSize()
        //  only returns the original size of the viewport (in screen pixels) even after
        //  the browser window has been resized.
        const topOffset =
          (imgBounds.getTopLeft().y / $imageLength) * navElement.clientHeight;

        const topLeft = navViewport.pixelFromPointNoRotate(
          bounds.getTopLeft(),
          false,
        );

        const bottomRight = navViewport.pixelFromPointNoRotate(
          bounds.getBottomRight(),
          false,
        );

        style.top = `${Math.round(topOffset)}px`;
        style.height = `${Math.abs(topLeft.y - bottomRight.y)}px`;
      }
    };

    // OSD event handlers

    // on open, configure an event listener for when the images arrive
    //  from the SDR
    openSeadragon.addHandler("open", () => {
      const osdCanvas = viewport.viewer.element.querySelector(
        ".openseadragon-canvas",
      );

      if (osdCanvas) {
        osdCanvas.tabIndex = 0;
        osdCanvas.setAttribute("role", "img");
        osdCanvas.setAttribute("aria-label", "Piano Roll Image Viewer");
      }

      if ($userSettings.hideRollImage) {
        rollImageReady = true;
      } else {
        const tiledImage = viewport.viewer.world.getItemAt(0);
        tiledImage.addOnceHandler(
          "fully-loaded-change",
          () => (rollImageReady = true),
        );
      }
    });

    // create the holes overlay SVG and "rewind" to the beginning of the
    //  performance when the viewport updates for the first time
    openSeadragon.addOnceHandler("update-viewport", () => {
      entireViewportRectangle = viewport.imageToViewportRectangle(
        0,
        0,
        $imageWidth,
        $imageLength,
      );
      updateSelectionOverlays();
      partitionExpressionOverlaySvgs($bassExpCurve, $trebleExpCurve);
      partitionHolesOverlaySvgs();
      updateViewportFromTick(0);
      navigator.viewport.fitVertically();
    });

    // update the height of the tracker bar and the PPI value passed to
    //  <RollViewerScaleBar/> when the zoom changes
    openSeadragon.addHandler("zoom", ({ zoom }) => {
      const imageZoom = viewport.viewportToImageZoom(zoom);
      trackerbarHeight = Math.max(1, $avgHoleWidth * imageZoom);
      ppi = imageZoom * 300;
      updateVisibleOverlays();
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
        new OpenSeadragon.Point(0, $imageLength),
      );

      const delta = viewport.deltaPointsFromPixels(event.delta.negate());
      if (viewport.getBounds().x !== viewport.getConstrainedBounds().x)
        delta.x = 0;
      const target = center.plus(delta);

      viewport.centerSpringX.springTo(target.x);
      viewport.centerSpringY.springTo(clamp(target.y, 0, verticalBound.y));

      updateTickFromViewport(/* animate = */ false);
    });

    // Again, the navigator viewport dims are not updated after the browser
    //  window is resized (as of OSD 4), so in that case we need a different
    //  approach to get the proper distance to move the main viewport and
    //  navigator overlay when the navigator strip is clicked or dragged.
    //  Always calculating this as a fraction of the full image length in
    //  pixels seems to work as well as any other method.
    const clickDragHandler = (event) => {
      event.preventDefaultAction = true;
      if (event.originalEvent.type === "pointerup" && !event.quick) return;
      const imageTargetY =
        $imageLength *
        (event.position.y / event.originalEvent.target.clientHeight);
      const targetNavCoords = navigator.viewport.imageToViewportCoordinates(
        new OpenSeadragon.Point(0, imageTargetY),
      );
      viewport.centerSpringY.springTo(targetNavCoords.y);
      updateTickFromViewport(
        /* animate = */ event.originalEvent.type === "pointerup",
      );
    };

    openSeadragon.addHandler("navigator-click", clickDragHandler);
    openSeadragon.addHandler("navigator-drag", clickDragHandler);

    navigator.innerTracker.releaseHandler = () => {
      // The releaseHandler for navigator viewports is delegated to an
      //  `onCanvasRelease` function (see
      //  https://github.com/openseadragon/openseadragon/blob/master/src/navigator.js#L586-L590 )
      //  which calls viewport.applyConstraints() whether constraints are
      //  wanted or not.  Since that's literally all it does (and we don't want
      //  constraints applied here), we'll just neuter it here.
    };

    // Draw highlights when OSD viewport updates
    _updateViewportHandler = () => drawActiveHighlights($throttledTick);
    openSeadragon.addHandler("update-viewport", _updateViewportHandler);

    if (!$userSettings.hideRollImage) openSeadragon.open(imageUrl);

    // Initialize highlight canvas context and size for active note drawing
    const resizeHighlightCanvas = () => {
      if (!highlightCanvas || !openSeadragon) return;
      const rect = highlightCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio ?? 1;
      highlightCanvas.width = Math.round(rect.width * dpr);
      highlightCanvas.height = Math.round(rect.height * dpr);
      highlightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    if (highlightCanvas) {
      highlightCtx = highlightCanvas.getContext("2d");
      resizeHighlightCanvas();
    }

    // Resize observer to keep canvas internal dimensions synced with CSS size
    if (highlightCanvas && typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(resizeHighlightCanvas);
      resizeObserver.observe(highlightCanvas.parentElement);
    }
  });

  onDestroy(() => {
    if (openSeadragon && _updateViewportHandler) {
      openSeadragon.removeHandler("update-viewport", _updateViewportHandler);
    }
  });

  const closeLatencyWarning = () => ($showLatencyWarning = false);

  const updateSelection = () => {
    if (openSeadragon === undefined) return;
    updateSelectionOverlays();
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: ($userSettings.keyboardFocusHoles, updateVisibleOverlays());
  $: ($playbackProgressStart, updateSelection());
  $: ($playbackProgressEnd, updateSelection());
  $: updateViewportFromTick($throttledTick);
  $: ($transposeHalfStep, rehighlightHoles($throttledTick));
  $: ($drawVelocityCurves,
    partitionExpressionOverlaySvgs($bassExpCurve, $trebleExpCurve));
  $: ($useInAppExpression,
    partitionExpressionOverlaySvgs($bassExpCurve, $trebleExpCurve));
  $: ($userSettings.activeNoteDetails,
    $userSettings.showNoteVelocities,
    $playExpressionsOnOff,
    drawActiveHighlights($throttledTick));

  export { adjustZoom, updateTickByViewportIncrement, panHorizontal };
</script>

<AriaAnnouncer {announcement} />

<div
  id="roll-viewer"
  role="presentation"
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
  on:focusout={() => viewport.viewer.removeOverlay(hoveredMark)}
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
    <RollViewerControls
      {openSeadragon}
      {minZoomLevel}
      {maxZoomLevel}
      {updateTickByViewportIncrement}
      {panHorizontal}
      {adjustZoom}
    />
    {#if showScaleBar}
      <RollViewerScaleBar {ppi} />
    {/if}
    {#if $userSettings.keyboardFocusHoles}
      <SkipLink targetAnchor="roll-skip-target" skipText="Skip roll image" />
    {/if}
  {/if}

  <canvas id="active-note-highlight-canvas" bind:this={highlightCanvas} />

  {#if $latencyDetected && $showLatencyWarning}
    <LatencyWarning {closeLatencyWarning} />
  {/if}
</div>
{#if $userSettings.keyboardFocusHoles}
  <SkipLink
    targetAnchor="active-note-highlight-canvas"
    skipText="Skip back to start of roll image"
  />
{/if}

<div id="roll-skip-target" />

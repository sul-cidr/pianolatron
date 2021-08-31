/*
 * This software was developed at the National Institute of Standards and
 * Technology by employees of the Federal Government in the course of
 * their official duties. Pursuant to title 17 Section 105 of the United
 * States Code this software is not subject to copyright protection and is
 * in the public domain. This software is an experimental system. NIST assumes
 * no responsibility whatsoever for its use by other parties, and makes no
 * guarantees, expressed or implied, about its quality, reliability, or
 * any other characteristic. We would appreciate acknowledgement if the
 * software is used.
 */

/**
 *
 * @author Antoine Vandecreme <antoine.vandecreme@nist.gov>
 */

import OpenSeadragon from "openseadragon";

function log10(x) {
  return Math.log(x) / Math.log(10);
}

function getWithUnit(value, unitSuffix) {
  if (value < 0.000001) {
    return `${value * 1000000000} n${unitSuffix}`;
  }
  if (value < 0.001) {
    return `${value * 1000000} μ${unitSuffix}`;
  }
  if (value < 1) {
    return `${value * 1000} m${unitSuffix}`;
  }
  if (value >= 1000) {
    return `${value / 1000} k${unitSuffix}`;
  }
  return `${value} ${unitSuffix}`;
}

function isDefined(variable) {
  return typeof variable !== "undefined";
}

function getSignificand(x) {
  return x * 10 ** Math.ceil(-log10(x));
}

function roundSignificand(x, decimalPlaces) {
  const exponent = -Math.ceil(-log10(x));
  const power = decimalPlaces - exponent;
  const significand = x * 10 ** power;
  // To avoid rounding problems, always work with integers
  if (power < 0) {
    return Math.round(significand) * 10 ** -power;
  }
  return Math.round(significand) / 10 ** power;
}

function normalize(value, minSize) {
  const significand = getSignificand(value);
  const minSizeSign = getSignificand(minSize);
  let result = getSignificand(significand / minSizeSign);
  if (result >= 5) {
    result /= 5;
  }
  if (result >= 4) {
    result /= 4;
  }
  if (result >= 2) {
    result /= 2;
  }
  return result;
}

function getScalebarSizeAndText(
  ppm,
  minSize,
  unitSuffix,
  handlePlural,
  spacer,
) {
  const scalebarSpacer = spacer === undefined ? " " : spacer;
  const value = normalize(ppm, minSize);
  const factor = roundSignificand((value / ppm) * minSize, 3);
  const size = value * minSize;
  const plural = handlePlural && factor > 1 ? "s" : "";
  return {
    size,
    text: factor + scalebarSpacer + unitSuffix + plural,
  };
}

function getScalebarSizeAndTextForMetric(ppm, minSize, unitSuffix) {
  const value = normalize(ppm, minSize);
  const factor = roundSignificand((value / ppm) * minSize, 3);
  const size = value * minSize;
  const valueWithUnit = getWithUnit(factor, unitSuffix);
  return {
    size,
    text: valueWithUnit,
  };
}

export const ScalebarType = {
  NONE: 0,
  MICROSCOPY: 1,
  MAP: 2,
};

export const ScalebarLocation = {
  NONE: 0,
  TOP_LEFT: 1,
  TOP_RIGHT: 2,
  BOTTOM_RIGHT: 3,
  BOTTOM_LEFT: 4,
};

/**
 *
 * @class Scalebar
 * @param {Object} options
 * @param {OpenSeadragon.Viewer} options.viewer The viewer to attach this
 * Scalebar to.
 * @param {OpenSeadragon.ScalebarType} options.type The scale bar type.
 * Default: microscopy
 * @param {Integer} options.pixelsPerMeter The pixels per meter of the
 * zoomable image at the original image size. If null, the scale bar is not
 * displayed. default: null
 * @param {Integer} options.referenceItemIdx Specify the item from
 * viewer.world to which options.pixelsPerMeter is refering.
 * default: 0
 * @param (String} options.minWidth The minimal width of the scale bar as a
 * CSS string (ex: 100px, 1em, 1% etc...) default: 150px
 * @param {OpenSeadragon.ScalebarLocation} options.location The location
 * of the scale bar inside the viewer. default: bottom left
 * @param {Integer} options.xOffset Offset location of the scale bar along x.
 * default: 5
 * @param {Integer} options.yOffset Offset location of the scale bar along y.
 * default: 5
 * @param {Boolean} options.stayInsideImage When set to true, keep the
 * scale bar inside the image when zooming out. default: true
 * @param {String} options.color The color of the scale bar using a color
 * name or the hexadecimal format (ex: black or #000000) default: black
 * @param {String} options.fontColor The font color. default: black
 * @param {String} options.backgroundColor The background color. default: none
 * @param {String} options.fontSize The font size. default: not set
 * @param {String} options.fontFamily The font-family. default: not set
 * @param {String} options.barThickness The thickness of the scale bar in px.
 * default: 2
 * @param {function} options.sizeAndTextRenderer A function which will be
 * called to determine the size of the scale bar and it's text content.
 * The function must have 2 parameters: the PPM at the current zoom level
 * and the minimum size of the scale bar. It must return an object containing
 * 2 attributes: size and text containing the size of the scale bar and the text.
 * default: $.ScalebarSizeAndTextRenderer.METRIC_LENGTH
 */

export class Scalebar {
  constructor(options) {
    options = options || {};
    if (!options.viewer) {
      throw new Error("A viewer must be specified.");
    }
    this.viewer = options.viewer;

    this.divElt = document.createElement("div");
    this.viewer.container.appendChild(this.divElt);
    this.divElt.style.position = "relative";
    this.divElt.style.margin = "0";
    this.divElt.style.pointerEvents = "none";

    this.setMinWidth(options.minWidth || "150px");

    this.setDrawScalebarFunction(
      ScalebarType[options.type] || ScalebarType.MICROSCOPY,
    );
    this.color = options.color || "black";
    this.fontColor = options.fontColor || "black";
    this.backgroundColor = options.backgroundColor || "none";
    this.fontSize = options.fontSize || "";
    this.fontFamily = options.fontFamily || "";
    this.barThickness = options.barThickness || 2;
    this.pixelsPerMeter = options.pixelsPerMeter || null;
    this.referenceItemIdx = options.referenceItemIdx || 0;
    this.location =
      ScalebarLocation[options.location] || ScalebarLocation.BOTTOM_LEFT;
    this.xOffset = options.xOffset || 5;
    this.yOffset = options.yOffset || 5;
    this.stayInsideImage = isDefined(options.stayInsideImage)
      ? options.stayInsideImage
      : true;
    this.sizeAndTextRenderer =
      ScalebarSizeAndTextRenderer[options.sizeAndTextRenderer] ||
      ScalebarSizeAndTextRenderer.METRIC_LENGTH;

    let self = this;
    this.viewer.addHandler("open", function () {
      self.refresh();
    });
    this.viewer.addHandler("animation", function () {
      self.refresh();
    });
    this.viewer.addHandler("resize", function () {
      self.refresh();
    });
  }

  updateOptions(options) {
    if (!options) {
      return;
    }
    if (isDefined(options.type)) {
      this.setDrawScalebarFunction(options.type);
    }
    if (isDefined(options.minWidth)) {
      this.setMinWidth(options.minWidth);
    }
    if (isDefined(options.color)) {
      this.color = options.color;
    }
    if (isDefined(options.fontColor)) {
      this.fontColor = options.fontColor;
    }
    if (isDefined(options.backgroundColor)) {
      this.backgroundColor = options.backgroundColor;
    }
    if (isDefined(options.fontSize)) {
      this.fontSize = options.fontSize;
    }
    if (isDefined(options.fontFamily)) {
      this.fontFamily = options.fontFamily;
    }
    if (isDefined(options.barThickness)) {
      this.barThickness = options.barThickness;
    }
    if (isDefined(options.pixelsPerMeter)) {
      this.pixelsPerMeter = options.pixelsPerMeter;
    }
    if (isDefined(options.referenceItemIdx)) {
      this.referenceItemIdx = options.referenceItemIdx;
    }
    if (isDefined(options.location)) {
      this.location = options.location;
    }
    if (isDefined(options.xOffset)) {
      this.xOffset = options.xOffset;
    }
    if (isDefined(options.yOffset)) {
      this.yOffset = options.yOffset;
    }
    if (isDefined(options.stayInsideImage)) {
      this.stayInsideImage = options.stayInsideImage;
    }
    if (isDefined(options.sizeAndTextRenderer)) {
      this.sizeAndTextRenderer = options.sizeAndTextRenderer;
    }
  }

  setDrawScalebarFunction(type) {
    if (!type) {
      this.drawScalebar = null;
    } else if (type === ScalebarType.MAP) {
      this.drawScalebar = this.drawMapScalebar;
    } else {
      this.drawScalebar = this.drawMicroscopyScalebar;
    }
  }

  setMinWidth(minWidth) {
    this.divElt.style.width = minWidth;
    // Make sure to display the element before getting is width
    this.divElt.style.display = "";
    this.minWidth = this.divElt.offsetWidth;
  }

  /**
   * Refresh the scalebar with the options submitted.
   * @param {Object} options
   * @param {OpenSeadragon.ScalebarType} options.type The scale bar type.
   * Default: microscopy
   * @param {Integer} options.pixelsPerMeter The pixels per meter of the
   * zoomable image at the original image size. If null, the scale bar is not
   * displayed. default: null
   * @param {Integer} options.referenceItemIdx Specify the item from
   * viewer.world to which options.pixelsPerMeter is refering.
   * default: 0
   * @param (String} options.minWidth The minimal width of the scale bar as a
   * CSS string (ex: 100px, 1em, 1% etc...) default: 150px
   * @param {OpenSeadragon.ScalebarLocation} options.location The location
   * of the scale bar inside the viewer. default: bottom left
   * @param {Integer} options.xOffset Offset location of the scale bar along x.
   * default: 5
   * @param {Integer} options.yOffset Offset location of the scale bar along y.
   * default: 5
   * @param {Boolean} options.stayInsideImage When set to true, keep the
   * scale bar inside the image when zooming out. default: true
   * @param {String} options.color The color of the scale bar using a color
   * name or the hexadecimal format (ex: black or #000000) default: black
   * @param {String} options.fontColor The font color. default: black
   * @param {String} options.backgroundColor The background color. default: none
   * @param {String} options.fontSize The font size. default: not set
   * @param {String} options.barThickness The thickness of the scale bar in px.
   * default: 2
   * @param {function} options.sizeAndTextRenderer A function which will be
   * called to determine the size of the scale bar and it's text content.
   * The function must have 2 parameters: the PPM at the current zoom level
   * and the minimum size of the scale bar. It must return an object containing
   * 2 attributes: size and text containing the size of the scale bar and the text.
   * default: $.ScalebarSizeAndTextRenderer.METRIC_LENGTH
   */
  refresh(options) {
    this.updateOptions(options);

    if (
      !this.viewer.isOpen() ||
      !this.drawScalebar ||
      !this.pixelsPerMeter ||
      !this.location
    ) {
      this.divElt.style.display = "none";
      return;
    }
    this.divElt.style.display = "";

    let viewport = this.viewer.viewport;
    let zoom = viewport.viewportToImageZoom(viewport.getZoom(true));
    let currentPPM = zoom * this.pixelsPerMeter;
    let props = this.sizeAndTextRenderer(currentPPM, this.minWidth);

    this.drawScalebar(props.size, props.text);
    let location = this.getScalebarLocation();
    this.divElt.style.left = location.x + "px";
    this.divElt.style.top = location.y + "px";
  }

  drawMicroscopyScalebar(size, text) {
    this.divElt.style.fontSize = this.fontSize;
    this.divElt.style.fontFamily = this.fontFamily;
    this.divElt.style.textAlign = "center";
    this.divElt.style.color = this.fontColor;
    this.divElt.style.border = "none";
    this.divElt.style.borderBottom =
      this.barThickness + "px solid " + this.color;
    this.divElt.style.backgroundColor = this.backgroundColor;
    this.divElt.innerHTML = text;
    this.divElt.style.width = size + "px";
  }

  drawMapScalebar(size, text) {
    this.divElt.style.fontSize = this.fontSize;
    this.divElt.style.fontFamily = this.fontFamily;
    this.divElt.style.textAlign = "center";
    this.divElt.style.color = this.fontColor;
    this.divElt.style.border = this.barThickness + "px solid " + this.color;
    this.divElt.style.borderTop = "none";
    this.divElt.style.backgroundColor = this.backgroundColor;
    this.divElt.innerHTML = text;
    this.divElt.style.width = size + "px";
  }

  /**
   * Compute the location of the scale bar.
   * @returns {OpenSeadragon.Point}
   */
  getScalebarLocation() {
    if (this.location === ScalebarLocation.TOP_LEFT) {
      let x = 0;
      let y = 0;
      if (this.stayInsideImage) {
        let pixel = this.viewer.viewport.pixelFromPoint(
          new OpenSeadragon.Point(0, 0),
          true,
        );
        if (!this.viewer.wrapHorizontal) {
          x = Math.max(pixel.x, 0);
        }
        if (!this.viewer.wrapVertical) {
          y = Math.max(pixel.y, 0);
        }
      }
      return new OpenSeadragon.Point(x + this.xOffset, y + this.yOffset);
    }
    if (this.location === ScalebarLocation.TOP_RIGHT) {
      let barWidth = this.divElt.offsetWidth;
      let container = this.viewer.container;
      let x = container.offsetWidth - barWidth;
      let y = 0;
      if (this.stayInsideImage) {
        let pixel = this.viewer.viewport.pixelFromPoint(
          new OpenSeadragon.Point(1, 0),
          true,
        );
        if (!this.viewer.wrapHorizontal) {
          x = Math.min(x, pixel.x - barWidth);
        }
        if (!this.viewer.wrapVertical) {
          y = Math.max(y, pixel.y);
        }
      }
      return new OpenSeadragon.Point(x - this.xOffset, y + this.yOffset);
    }
    if (this.location === ScalebarLocation.BOTTOM_RIGHT) {
      let barWidth = this.divElt.offsetWidth;
      let barHeight = this.divElt.offsetHeight;
      let container = this.viewer.container;
      let x = container.offsetWidth - barWidth;
      let y = container.offsetHeight - barHeight;
      if (this.stayInsideImage) {
        let pixel = this.viewer.viewport.pixelFromPoint(
          new OpenSeadragon.Point(1, 1 / this.viewer.source.aspectRatio),
          true,
        );
        if (!this.viewer.wrapHorizontal) {
          x = Math.min(x, pixel.x - barWidth);
        }
        if (!this.viewer.wrapVertical) {
          y = Math.min(y, pixel.y - barHeight);
        }
      }
      return new OpenSeadragon.Point(x - this.xOffset, y - this.yOffset);
    }
    if (this.location === ScalebarLocation.BOTTOM_LEFT) {
      let barHeight = this.divElt.offsetHeight;
      let container = this.viewer.container;
      let x = 0;
      let y = container.offsetHeight - barHeight;
      if (this.stayInsideImage) {
        let pixel = this.viewer.viewport.pixelFromPoint(
          new OpenSeadragon.Point(0, 1 / this.viewer.source.aspectRatio),
          true,
        );
        if (!this.viewer.wrapHorizontal) {
          x = Math.max(x, pixel.x);
        }
        if (!this.viewer.wrapVertical) {
          y = Math.min(y, pixel.y - barHeight);
        }
      }
      return new OpenSeadragon.Point(x + this.xOffset, y - this.yOffset);
    }
  }

  /**
   * Get the rendered scalebar in a canvas.
   * @returns {Element} A canvas containing the scalebar representation
   */
  getAsCanvas() {
    let canvas = document.createElement("canvas");
    canvas.width = this.divElt.offsetWidth;
    canvas.height = this.divElt.offsetHeight;
    let context = canvas.getContext("2d");
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = this.color;
    context.fillRect(
      0,
      canvas.height - this.barThickness,
      canvas.width,
      canvas.height,
    );
    if (this.drawScalebar === this.drawMapScalebar) {
      context.fillRect(0, 0, this.barThickness, canvas.height);
      context.fillRect(
        canvas.width - this.barThickness,
        0,
        this.barThickness,
        canvas.height,
      );
    }
    context.font = window.getComputedStyle(this.divElt).font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = this.fontColor;
    let hCenter = canvas.width / 2;
    let vCenter = canvas.height / 2;
    context.fillText(this.divElt.textContent, hCenter, vCenter);
    return canvas;
  }

  /**
   * Get a copy of the current OpenSeadragon canvas with the scalebar.
   * @returns {Element} A canvas containing a copy of the current OpenSeadragon canvas with the scalebar
   */
  getImageWithScalebarAsCanvas() {
    let imgCanvas = this.viewer.drawer.canvas;
    let newCanvas = document.createElement("canvas");
    newCanvas.width = imgCanvas.width;
    newCanvas.height = imgCanvas.height;
    let newCtx = newCanvas.getContext("2d");
    newCtx.drawImage(imgCanvas, 0, 0);
    let scalebarCanvas = this.getAsCanvas();
    let location = this.getScalebarLocation();
    newCtx.drawImage(scalebarCanvas, location.x, location.y);
    return newCanvas;
  }
}

export class ScalebarSizeAndTextRenderer {
  /**
   * Metric length. From nano meters to kilometers.
   */
  static METRIC_LENGTH(ppm, minSize) {
    return getScalebarSizeAndTextForMetric(ppm, minSize, "m");
  }
  /**
   * Imperial length. Choosing the best unit from thou, inch, foot and mile.
   */
  static IMPERIAL_LENGTH(ppm, minSize) {
    let maxSize = minSize * 2;
    let ppi = ppm * 0.0254;
    if (maxSize < ppi * 12) {
      //   if (maxSize < ppi) {
      //     let ppt = ppi / 1000;
      //     return getScalebarSizeAndText(ppt, minSize, "th");
      //   }
      return getScalebarSizeAndText(ppi, minSize, "in");
    }
    let ppf = ppi * 12;
    if (maxSize < ppf * 2000) {
      return getScalebarSizeAndText(ppf, minSize, "ft");
    }
    let ppmi = ppf * 5280;
    return getScalebarSizeAndText(ppmi, minSize, "mi");
  }
  /**
   * Astronomy units. Choosing the best unit from arcsec, arcminute, and degree
   */
  static ASTRONOMY(ppa, minSize) {
    let maxSize = minSize * 2;
    if (maxSize < ppa * 60) {
      return getScalebarSizeAndText(ppa, minSize, '"', false, "");
    }
    let ppminutes = ppa * 60;
    if (maxSize < ppminutes * 60) {
      return getScalebarSizeAndText(ppminutes, minSize, "'", false, "");
    }
    let ppd = ppminutes * 60;
    return getScalebarSizeAndText(ppd, minSize, "&#176", false, "");
  }
  /**
   * Standard time. Choosing the best unit from second (and metric divisions),
   * minute, hour, day and year.
   */
  static STANDARD_TIME(pps, minSize) {
    let maxSize = minSize * 2;
    if (maxSize < pps * 60) {
      return getScalebarSizeAndTextForMetric(pps, minSize, "s", false);
    }
    let ppminutes = pps * 60;
    if (maxSize < ppminutes * 60) {
      return getScalebarSizeAndText(ppminutes, minSize, "minute", true);
    }
    let pph = ppminutes * 60;
    if (maxSize < pph * 24) {
      return getScalebarSizeAndText(pph, minSize, "hour", true);
    }
    let ppd = pph * 24;
    if (maxSize < ppd * 365.25) {
      return getScalebarSizeAndText(ppd, minSize, "day", true);
    }
    let ppy = ppd * 365.25;
    return getScalebarSizeAndText(ppy, minSize, "year", true);
  }
  /**
   * Generic metric unit. One can use this function to create a new metric
   * scale. For example, here is an implementation of energy levels:
   * function(ppeV, minSize) {
   *   return OpenSeadragon.ScalebarSizeAndTextRenderer.METRIC_GENERIC(
   *           ppeV, minSize, "eV");
   * }
   */
  static METRIC_GENERIC(unit, minSize, unitSuffix) {
    getScalebarSizeAndTextForMetric(unit, minSize, unitSuffix);
  }
}

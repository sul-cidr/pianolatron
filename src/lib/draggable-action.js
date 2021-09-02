import { clamp } from "./utils";

export const draggable = (node, corral = false) => {
  const {
    top: parentTop,
    left: parentLeft,
    width: parentWidth,
    height: parentHeight,
  } = node.parentElement.getBoundingClientRect();
  const { style } = node;

  let { left, top } = node.getBoundingClientRect();
  let dragging = false;

  left -= parentLeft;
  top -= parentTop;

  style.position = "absolute";
  style.top = `${top}px`;
  style.left = `${left}px`;
  style.cursor = "move";
  style.userSelect = "none";

  const releaseDrag = () => {
    window.document.body.style.cursor = "unset";
    dragging = false;
  };

  node.addEventListener("mousedown", () => {
    window.document.body.style.cursor = "move";
    dragging = true;
  });

  window.addEventListener("mousemove", (event) => {
    if (dragging) {
      const { height, width } = node.getBoundingClientRect();
      left += event.movementX;
      top += event.movementY;
      if (corral) {
        left = clamp(left, 0, parentWidth - width);
        top = clamp(top, 0, parentHeight - height);
      }
      style.left = `${left}px`;
      style.top = `${top}px`;
    }
  });

  window.addEventListener("mouseup", releaseDrag);
  document.documentElement.addEventListener("mouseleave", releaseDrag);
};

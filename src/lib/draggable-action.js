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

  node.addEventListener("mousedown", () => (dragging = true));

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

  window.addEventListener("mouseup", () => (dragging = false));
};

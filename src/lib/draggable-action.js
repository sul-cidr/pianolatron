import { clamp } from "./utils";

export const draggable = (node, corral = false) => {
  const { style } = node;

  let {
    top: parentTop,
    left: parentLeft,
    width: parentWidth,
    height: parentHeight,
  } = node.parentElement.getBoundingClientRect();
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

  const updatePosition = (event) => {
    left += event?.movementX || 0;
    top += event?.movementY || 0;
    if (corral) {
      const { height, width } = node.getBoundingClientRect();
      left = clamp(left, 0, parentWidth - width);
      top = clamp(top, 0, parentHeight - height);
    }
    style.left = `${left}px`;
    style.top = `${top}px`;
  };

  const resizeObserver = new ResizeObserver(() => {
    ({
      top: parentTop,
      left: parentLeft,
      width: parentWidth,
      height: parentHeight,
    } = node.parentElement.getBoundingClientRect());
    updatePosition();
  });
  resizeObserver.observe(node.parentElement);

  node.addEventListener("mousedown", () => {
    window.document.body.style.cursor = "move";
    dragging = true;
  });

  window.addEventListener("mousemove", (event) => {
    if (dragging) updatePosition(event);
  });

  window.addEventListener("mouseup", releaseDrag);
  document.documentElement.addEventListener("mouseleave", releaseDrag);

  return { destroy: resizeObserver.disconnect };
};

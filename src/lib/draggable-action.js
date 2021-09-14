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

  const startDrag = () => {
    window.document.body.style.cursor = "move";
    dragging = true;
  };

  const releaseDrag = () => {
    window.document.body.style.cursor = "unset";
    dragging = false;
  };

  const drag = (event) => {
    if (dragging) updatePosition(event);
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

  node.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", drag);
  window.addEventListener("mouseup", releaseDrag);
  document.documentElement.addEventListener("mouseleave", releaseDrag);

  return {
    destroy() {
      resizeObserver.disconnect();
      node.removeEventListener("mousedown", startDrag);
      window.removeEventListener("mousemove", drag);
      window.removeEventListener("mouseup", releaseDrag);
      document.documentElement.removeEventListener("mouseleave", releaseDrag);
    },
  };
};

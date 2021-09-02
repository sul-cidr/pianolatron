export const draggable = (node) => {
  const { top: parentTop, left: parentLeft } =
    node.parentElement.getBoundingClientRect();
  const { style } = node;

  let { top, left } = node.getBoundingClientRect();
  let moving = false;

  left -= parentLeft;
  top -= parentTop;

  style.position = "absolute";
  style.top = `${top}px`;
  style.left = `${left}px`;
  style.cursor = "move";
  style.userSelect = "none";

  node.addEventListener("mousedown", () => (moving = true));

  window.addEventListener("mousemove", (event) => {
    if (moving) {
      left += event.movementX;
      top += event.movementY;
      style.top = `${top}px`;
      style.left = `${left}px`;
    }
  });

  window.addEventListener("mouseup", () => (moving = false));
};

import { createPopper } from "@popperjs/core/lib/popper-lite";
import Tooltip from "./Tooltip.svelte";

export const tooltip = (node, text) => {
  let popperInstance;
  let componentInstance;

  const attachTooltip = () => {
    componentInstance = new Tooltip({
      target: document.body,
      props: { text },
    });

    popperInstance = createPopper(node, componentInstance.element, {
      placement: "top",
    });
  };

  const removeTooltip = () => {
    popperInstance?.destroy();
    popperInstance = null;
    componentInstance.$destroy();
  };

  node.addEventListener("mouseenter", attachTooltip);
  node.addEventListener("mouseleave", removeTooltip);

  return {
    destroy() {
      node.removeEventListener("mouseenter", attachTooltip);
      node.removeEventListener("mouseleave", removeTooltip);
    },
  };
};

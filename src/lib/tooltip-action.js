import { createPopper } from "@popperjs/core/lib/popper-lite";
import preventOverflow from "@popperjs/core/lib/modifiers/preventOverflow";
import arrow from "@popperjs/core/lib/modifiers/arrow";
import Tooltip from "./Tooltip.svelte";

export const tooltip = (node, text) => {
  if (!text) return {};
  let popperInstance;
  let componentInstance;

  const attachTooltip = () => {
    componentInstance = new Tooltip({
      target: document.body,
      props: { text },
    });

    popperInstance = createPopper(node, componentInstance.element, {
      placement: "top",
      modifiers: [
        preventOverflow,
        {
          name: "preventOverflow",
          options: {
            padding: 8,
          },
        },
        arrow,
      ],
    });
  };

  const removeTooltip = () => {
    popperInstance?.destroy();
    popperInstance = null;
    componentInstance?.$destroy();
  };

  node.addEventListener("mouseenter", attachTooltip);
  node.addEventListener("mouseleave", removeTooltip);

  return {
    destroy() {
      removeTooltip();
      node.removeEventListener("mouseenter", attachTooltip);
      node.removeEventListener("mouseleave", removeTooltip);
    },
  };
};

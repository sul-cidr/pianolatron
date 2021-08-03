import './RollViewer.svelte.css.proxy.js';
/* src/components/RollViewer.svelte generated by Svelte v3.41.0 */
import {
	SvelteComponent,
	add_flush_callback,
	add_render_callback,
	append,
	attr,
	bind,
	binding_callbacks,
	check_outros,
	component_subscribe,
	create_bidirectional_transition,
	create_component,
	destroy_component,
	detach,
	element,
	group_outros,
	init,
	insert,
	listen,
	mount_component,
	prevent_default,
	run_all,
	safe_not_equal,
	space,
	toggle_class,
	transition_in,
	transition_out
} from "../_snowpack/pkg/svelte/internal.js";

import { onMount } from "../_snowpack/pkg/svelte.js";
import { fade } from "../_snowpack/pkg/svelte/transition.js";
import OpenSeadragon from "../_snowpack/pkg/openseadragon.js";
import { rollMetadata, currentTick, userSettings, playingNow } from "../stores.js";
import { clamp, getNoteLabel } from "../utils.js";
import RollViewerControls from "./RollViewerControls.svelte.js";

function create_if_block_1(ctx) {
	let p;
	let p_transition;
	let current;

	return {
		c() {
			p = element("p");
			p.textContent = "Downloading roll image...";
			attr(p, "class", "svelte-zzqd0t");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			current = true;
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, true);
				p_transition.run(1);
			});

			current = true;
		},
		o(local) {
			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, false);
			p_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(p);
			if (detaching && p_transition) p_transition.end();
		}
	};
}

// (365:2) {#if showControls}
function create_if_block(ctx) {
	let rollviewercontrols;
	let updating_strafing;
	let current;

	function rollviewercontrols_strafing_binding(value) {
		/*rollviewercontrols_strafing_binding*/ ctx[12](value);
	}

	let rollviewercontrols_props = {
		openSeadragon: /*openSeadragon*/ ctx[0],
		minZoomLevel,
		maxZoomLevel,
		panByIncrement: /*panByIncrement*/ ctx[5]
	};

	if (/*strafing*/ ctx[1] !== void 0) {
		rollviewercontrols_props.strafing = /*strafing*/ ctx[1];
	}

	rollviewercontrols = new RollViewerControls({ props: rollviewercontrols_props });
	binding_callbacks.push(() => bind(rollviewercontrols, 'strafing', rollviewercontrols_strafing_binding));

	return {
		c() {
			create_component(rollviewercontrols.$$.fragment);
		},
		m(target, anchor) {
			mount_component(rollviewercontrols, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const rollviewercontrols_changes = {};
			if (dirty & /*openSeadragon*/ 1) rollviewercontrols_changes.openSeadragon = /*openSeadragon*/ ctx[0];

			if (!updating_strafing && dirty & /*strafing*/ 2) {
				updating_strafing = true;
				rollviewercontrols_changes.strafing = /*strafing*/ ctx[1];
				add_flush_callback(() => updating_strafing = false);
			}

			rollviewercontrols.$set(rollviewercontrols_changes);
		},
		i(local) {
			if (current) return;
			transition_in(rollviewercontrols.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(rollviewercontrols.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(rollviewercontrols, detaching);
		}
	};
}

function create_fragment(ctx) {
	let div;
	let t;
	let current;
	let mounted;
	let dispose;
	let if_block0 = !/*rollImageReady*/ ctx[2] && create_if_block_1(ctx);
	let if_block1 = /*showControls*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "id", "roll-viewer");
			attr(div, "class", "svelte-zzqd0t");
			toggle_class(div, "active-note-details", /*$userSettings*/ ctx[4].activeNoteDetails);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t);
			if (if_block1) if_block1.m(div, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div, "mouseenter", /*mouseenter_handler*/ ctx[13]),
					listen(div, "mouseleave", /*mouseleave_handler*/ ctx[14]),
					listen(div, "wheel", prevent_default(/*wheel_handler*/ ctx[15]), true)
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!/*rollImageReady*/ ctx[2]) {
				if (if_block0) {
					if (dirty & /*rollImageReady*/ 4) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div, t);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*showControls*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*showControls*/ 8) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (dirty & /*$userSettings*/ 16) {
				toggle_class(div, "active-note-details", /*$userSettings*/ ctx[4].activeNoteDetails);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

const defaultZoomLevel = 1;
const minZoomLevel = 0.1;
const maxZoomLevel = 4;

function instance($$self, $$props, $$invalidate) {
	let scrollDownwards;
	let $rollMetadata;
	let $currentTick;
	let $playingNow;
	let $userSettings;
	component_subscribe($$self, rollMetadata, $$value => $$invalidate(10, $rollMetadata = $$value));
	component_subscribe($$self, currentTick, $$value => $$invalidate(11, $currentTick = $$value));
	component_subscribe($$self, playingNow, $$value => $$invalidate(23, $playingNow = $$value));
	component_subscribe($$self, userSettings, $$value => $$invalidate(4, $userSettings = $$value));
	let { imageUrl } = $$props;
	let { holesByTickInterval } = $$props;
	let { skipToTick } = $$props;
	let openSeadragon;
	let viewport;
	let firstHolePx;
	let strafing = false;
	let rollImageReady;
	let marks = [];
	let hoveredMark;
	let showControls;
	let imageLength;
	let imageWidth;
	let avgHoleWidth;

	const createMark = hole => {
		const { x: offsetX, y: offsetY, w: width, h: height, m: midiKey, v: velocity } = hole;
		const mark = document.createElement("mark");
		let noteLabel = getNoteLabel(midiKey, $rollMetadata.ROLL_TYPE);

		if (velocity && $userSettings.showNoteVelocities) {
			noteLabel += `\nv:${velocity}`;
		}

		mark.dataset.info = noteLabel;

		mark.addEventListener("mouseout", () => {
			if (!marks.map(([_hole]) => _hole).includes(hole)) viewport.viewer.removeOverlay(hoveredMark);
		});

		const viewportRectangle = viewport.imageToViewportRectangle(
			offsetX,
			scrollDownwards
			? offsetY
			: imageLength - offsetY - height,
			width,
			height
		);

		const imgBounds = viewport.viewportToImageRectangle(viewport.getBounds());
		const markFractionalPosition = parseFloat(offsetX + width / 2 - imgBounds.x) / parseFloat(imgBounds.width);
		mark.classList.toggle("flag-left", markFractionalPosition > 0.8);
		viewport.viewer.addOverlay(mark, viewportRectangle);
		return mark;
	};

	const createHolesOverlaySvg = () => {
		const { holeData } = $rollMetadata;
		if (!holeData) return;
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
		const entireViewportRectangle = viewport.imageToViewportRectangle(0, 0, imageWidth, imageLength);
		svg.setAttribute("width", imageWidth);
		svg.setAttribute("height", imageLength);
		svg.setAttribute("viewBox", `0 0 ${imageWidth} ${imageLength}`);
		svg.appendChild(g);

		holeData.forEach(hole => {
			const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			const { x: offsetX, y: offsetY, w: width, h: height } = hole;
			rect.setAttribute("x", offsetX);

			rect.setAttribute("y", scrollDownwards
			? offsetY
			: imageLength - offsetY - height);

			rect.setAttribute("width", width);
			rect.setAttribute("height", height);

			rect.addEventListener("mouseover", () => {
				if (marks.map(([_hole]) => _hole).includes(hole)) return;
				viewport.viewer.removeOverlay(hoveredMark);
				hoveredMark = createMark(hole);
			});

			g.appendChild(rect);
		});

		viewport.viewer.addOverlay(svg, entireViewportRectangle);
	};

	const advanceToTick = tick => {
		if (!openSeadragon) return;

		// if we're panning horizontally we want the target bounds, if otherwise
		//  (and most especially if we happen to be zooming) we want the current bounds
		const viewportBounds = viewport.getBounds(!strafing);

		const linePx = firstHolePx + (scrollDownwards ? tick : -tick);
		const lineViewport = viewport.imageToViewportCoordinates(0, linePx);
		const lineCenter = new OpenSeadragon.Point(viewportBounds.x + viewportBounds.width / 2, lineViewport.y);
		viewport.panTo(lineCenter, $playingNow);
	};

	const highlightHoles = tick => {
		if (!openSeadragon) return;
		const holes = holesByTickInterval.search(tick, tick);

		marks = marks.filter(([hole, elem]) => {
			if (holes.includes(hole)) return true;
			viewport.viewer.removeOverlay(elem);
			return false;
		});

		holes.forEach(hole => {
			if (marks.map(([_hole]) => _hole).includes(hole)) return;
			const mark = createMark(hole);
			mark.classList.add("active");
			marks.push([hole, mark]);
		});
	};

	onMount(async () => {
		$$invalidate(0, openSeadragon = OpenSeadragon({
			id: "roll-viewer",
			showNavigationControl: false,
			panHorizontal: true,
			visibilityRatio: 1,
			defaultZoomLevel,
			minZoomLevel,
			maxZoomLevel,
			constrainDuringPan: true,
			preserveImageSizeOnResize: true,
			gestureSettingsMouse: { clickToZoom: false }
		}));

		({ viewport } = openSeadragon);

		openSeadragon.addOnceHandler("update-viewport", () => {
			createHolesOverlaySvg();
			advanceToTick(0);
		});

		openSeadragon.addHandler("canvas-drag", () => {
			const viewportCenter = viewport.getCenter(false);
			const imgCenter = viewport.viewportToImageCoordinates(viewportCenter);

			skipToTick(scrollDownwards
			? imgCenter.y - firstHolePx
			: firstHolePx - imgCenter.y);

			$$invalidate(1, strafing = true);
		});

		openSeadragon.addHandler("canvas-drag-end", () => $$invalidate(1, strafing = false));

		openSeadragon.addHandler("open", () => {
			const tiledImage = viewport.viewer.world.getItemAt(0);
			tiledImage.addOnceHandler("fully-loaded-change", () => $$invalidate(2, rollImageReady = true));
		});

		openSeadragon.addHandler("zoom", ({ zoom }) => {
			const imageZoom = viewport.viewportToImageZoom(zoom);
			const rv = document.getElementById("roll-viewer");
			if (!rv) return;
			const trackerbarHeight = Math.max(1, parseInt(avgHoleWidth * imageZoom, 10));
			rv.style.setProperty("--trackerbar-height", `${trackerbarHeight}px`);
		});

		openSeadragon.open(imageUrl);
	});

	const panByIncrement = (up = true) => {
		const viewportBounds = viewport.getBounds();
		const imgBounds = viewport.viewportToImageRectangle(viewportBounds);
		const delta = up ? imgBounds.height / 200 : -imgBounds.height / 200;
		const centerY = imgBounds.y + imgBounds.height / 2;

		skipToTick(scrollDownwards
		? clamp(centerY + delta - firstHolePx, -firstHolePx, imageLength - firstHolePx)
		: clamp(firstHolePx - centerY - delta, firstHolePx - imageLength, firstHolePx));
	};

	function rollviewercontrols_strafing_binding(value) {
		strafing = value;
		$$invalidate(1, strafing);
	}

	const mouseenter_handler = () => $$invalidate(3, showControls = true);
	const mouseleave_handler = () => $$invalidate(3, showControls = false);

	const wheel_handler = event => {
		if (event.ctrlKey) {
			panByIncrement(event.deltaY > 0);
			event.stopPropagation();
		}
	};

	$$self.$$set = $$props => {
		if ('imageUrl' in $$props) $$invalidate(6, imageUrl = $$props.imageUrl);
		if ('holesByTickInterval' in $$props) $$invalidate(7, holesByTickInterval = $$props.holesByTickInterval);
		if ('skipToTick' in $$props) $$invalidate(8, skipToTick = $$props.skipToTick);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$currentTick*/ 2048) {
			$: advanceToTick($currentTick);
		}

		if ($$self.$$.dirty & /*$currentTick*/ 2048) {
			$: highlightHoles($currentTick);
		}

		if ($$self.$$.dirty & /*$rollMetadata*/ 1024) {
			$: $$invalidate(9, scrollDownwards = $rollMetadata.ROLL_TYPE === "welte-red");
		}

		if ($$self.$$.dirty & /*$rollMetadata*/ 1024) {
			$: imageLength = parseInt($rollMetadata.IMAGE_LENGTH, 10);
		}

		if ($$self.$$.dirty & /*$rollMetadata*/ 1024) {
			$: imageWidth = parseInt($rollMetadata.IMAGE_WIDTH, 10);
		}

		if ($$self.$$.dirty & /*$rollMetadata*/ 1024) {
			$: avgHoleWidth = parseInt($rollMetadata.AVG_HOLE_WIDTH, 10);
		}

		if ($$self.$$.dirty & /*scrollDownwards, $rollMetadata*/ 1536) {
			$: firstHolePx = scrollDownwards
			? parseInt($rollMetadata.FIRST_HOLE, 10)
			: parseInt($rollMetadata.IMAGE_LENGTH, 10) - parseInt($rollMetadata.FIRST_HOLE, 10);
		}
	};

	return [
		openSeadragon,
		strafing,
		rollImageReady,
		showControls,
		$userSettings,
		panByIncrement,
		imageUrl,
		holesByTickInterval,
		skipToTick,
		scrollDownwards,
		$rollMetadata,
		$currentTick,
		rollviewercontrols_strafing_binding,
		mouseenter_handler,
		mouseleave_handler,
		wheel_handler
	];
}

class RollViewer extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			imageUrl: 6,
			holesByTickInterval: 7,
			skipToTick: 8
		});
	}
}

export default RollViewer;
import './FlexCollapsible.svelte.css.proxy.js';
/* src/ui-components/FlexCollapsible.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	append,
	attr,
	create_slot,
	detach,
	element,
	init,
	insert,
	listen,
	null_to_empty,
	safe_not_equal,
	space,
	toggle_class,
	transition_in,
	transition_out,
	update_slot
} from "../_snowpack/pkg/svelte/internal.js";

function create_fragment(ctx) {
	let div1;
	let input;
	let input_id_value;
	let t0;
	let label;
	let label_for_value;
	let t1;
	let div0;
	let div0_style_value;
	let div1_class_value;
	let div1_style_value;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div1 = element("div");
			input = element("input");
			t0 = space();
			label = element("label");
			t1 = space();
			div0 = element("div");
			if (default_slot) default_slot.c();
			attr(input, "type", "checkbox");
			attr(input, "id", input_id_value = `${/*id*/ ctx[0]}_collapse`);
			attr(input, "class", "svelte-1xif3lm");
			attr(label, "for", label_for_value = `${/*id*/ ctx[0]}_collapse`);
			attr(label, "class", "svelte-1xif3lm");
			attr(div0, "style", div0_style_value = `width: ${/*width*/ ctx[1]};`);
			attr(div0, "class", "svelte-1xif3lm");
			attr(div1, "id", /*id*/ ctx[0]);
			attr(div1, "class", div1_class_value = "" + (null_to_empty(`flex-collapsible ${/*position*/ ctx[2]}`) + " svelte-1xif3lm"));
			attr(div1, "style", div1_style_value = `width: ${/*hidden*/ ctx[3] ? 0 : /*width*/ ctx[1]};`);
			toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, input);
			input.checked = /*hidden*/ ctx[3];
			append(div1, t0);
			append(div1, label);
			append(div1, t1);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(input, "change", /*input_change_handler*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*id*/ 1 && input_id_value !== (input_id_value = `${/*id*/ ctx[0]}_collapse`)) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*hidden*/ 8) {
				input.checked = /*hidden*/ ctx[3];
			}

			if (!current || dirty & /*id*/ 1 && label_for_value !== (label_for_value = `${/*id*/ ctx[0]}_collapse`)) {
				attr(label, "for", label_for_value);
			}

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 16) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
				}
			}

			if (!current || dirty & /*width*/ 2 && div0_style_value !== (div0_style_value = `width: ${/*width*/ ctx[1]};`)) {
				attr(div0, "style", div0_style_value);
			}

			if (!current || dirty & /*id*/ 1) {
				attr(div1, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*position*/ 4 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`flex-collapsible ${/*position*/ ctx[2]}`) + " svelte-1xif3lm"))) {
				attr(div1, "class", div1_class_value);
			}

			if (!current || dirty & /*hidden, width*/ 10 && div1_style_value !== (div1_style_value = `width: ${/*hidden*/ ctx[3] ? 0 : /*width*/ ctx[1]};`)) {
				attr(div1, "style", div1_style_value);
			}

			if (dirty & /*position, hidden*/ 12) {
				toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { id } = $$props;
	let { width } = $$props;
	let { position = "right" } = $$props;
	let hidden = false;

	function input_change_handler() {
		hidden = this.checked;
		$$invalidate(3, hidden);
	}

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("width" in $$props) $$invalidate(1, width = $$props.width);
		if ("position" in $$props) $$invalidate(2, position = $$props.position);
		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [id, width, position, hidden, $$scope, slots, input_change_handler];
}

class FlexCollapsible extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { id: 0, width: 1, position: 2 });
	}
}

export default FlexCollapsible;
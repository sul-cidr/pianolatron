import './RangeSlider.svelte.css.proxy.js';
/* src/ui-components/RangeSlider.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	attr,
	bubble,
	detach,
	element,
	init,
	insert,
	is_function,
	listen,
	noop,
	run_all,
	safe_not_equal,
	set_input_value,
	to_number
} from "../_snowpack/pkg/svelte/internal.js";

function create_fragment(ctx) {
	let input;
	let mounted;
	let dispose;

	return {
		c() {
			input = element("input");
			attr(input, "type", "range");
			attr(input, "min", /*min*/ ctx[1]);
			attr(input, "max", /*max*/ ctx[2]);
			attr(input, "step", /*step*/ ctx[3]);
			attr(input, "name", /*name*/ ctx[4]);
			attr(input, "class", "svelte-7qselp");
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, /*value*/ ctx[0]);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_input_handler*/ ctx[8]),
					listen(input, "input", /*input_change_input_handler*/ ctx[8]),
					listen(input, "input", /*input_handler*/ ctx[7]),
					listen(input, "mousewheel", function () {
						if (is_function(/*mousewheel*/ ctx[5]
						? /*handleWheel*/ ctx[6]
						: mousewheel_handler)) (/*mousewheel*/ ctx[5]
						? /*handleWheel*/ ctx[6]
						: mousewheel_handler).apply(this, arguments);
					})
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*min*/ 2) {
				attr(input, "min", /*min*/ ctx[1]);
			}

			if (dirty & /*max*/ 4) {
				attr(input, "max", /*max*/ ctx[2]);
			}

			if (dirty & /*step*/ 8) {
				attr(input, "step", /*step*/ ctx[3]);
			}

			if (dirty & /*name*/ 16) {
				attr(input, "name", /*name*/ ctx[4]);
			}

			if (dirty & /*value*/ 1) {
				set_input_value(input, /*value*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(input);
			mounted = false;
			run_all(dispose);
		}
	};
}

const mousewheel_handler = () => {
	
};

function instance($$self, $$props, $$invalidate) {
	let { min } = $$props;
	let { max } = $$props;
	let { step } = $$props;
	let { name } = $$props;
	let { value } = $$props;
	let { mousewheel = true } = $$props;
	const clamp = value => Math.min(Math.max(value, min), max);

	const handleWheel = event => {
		const precision = (step.split(".")[1] || "").length;

		if (event.deltaY > 0) {
			$$invalidate(0, value = clamp((Number(value) + Number(step)).toFixed(precision)));
		} else {
			$$invalidate(0, value = clamp((Number(value) - Number(step)).toFixed(precision)));
		}
	};

	function input_handler(event) {
		bubble($$self, event);
	}

	function input_change_input_handler() {
		value = to_number(this.value);
		$$invalidate(0, value);
	}

	$$self.$$set = $$props => {
		if ("min" in $$props) $$invalidate(1, min = $$props.min);
		if ("max" in $$props) $$invalidate(2, max = $$props.max);
		if ("step" in $$props) $$invalidate(3, step = $$props.step);
		if ("name" in $$props) $$invalidate(4, name = $$props.name);
		if ("value" in $$props) $$invalidate(0, value = $$props.value);
		if ("mousewheel" in $$props) $$invalidate(5, mousewheel = $$props.mousewheel);
	};

	return [
		value,
		min,
		max,
		step,
		name,
		mousewheel,
		handleWheel,
		input_handler,
		input_change_input_handler
	];
}

class RangeSlider extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			min: 1,
			max: 2,
			step: 3,
			name: 4,
			value: 0,
			mousewheel: 5
		});
	}
}

export default RangeSlider;
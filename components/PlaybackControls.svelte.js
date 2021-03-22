import './PlaybackControls.svelte.css.proxy.js';
/* src/components/PlaybackControls.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	append,
	attr,
	component_subscribe,
	detach,
	element,
	init,
	insert,
	is_function,
	listen,
	noop,
	run_all,
	safe_not_equal,
	set_data,
	set_input_value,
	space,
	text,
	to_number,
	toggle_class
} from "../_snowpack/pkg/svelte/internal.js";

import { pedalling, volume } from "../stores.js";

function create_fragment(ctx) {
	let div3;
	let button0;
	let t1;
	let button1;
	let t3;
	let button2;
	let t4;
	let button2_aria_pressed_value;
	let t5;
	let button3;
	let t6;
	let button3_aria_pressed_value;
	let t7;
	let div0;
	let t8;
	let input0;
	let t9;
	let t10_value = /*$volume*/ ctx[3].master + "";
	let t10;
	let t11;
	let div1;
	let t12;
	let input1;
	let t13;
	let t14_value = /*$volume*/ ctx[3].left + "";
	let t14;
	let t15;
	let div2;
	let t16;
	let input2;
	let t17;
	let t18_value = /*$volume*/ ctx[3].right + "";
	let t18;
	let mounted;
	let dispose;

	return {
		c() {
			div3 = element("div");
			button0 = element("button");
			button0.textContent = "Play/Pause";
			t1 = space();
			button1 = element("button");
			button1.textContent = "Stop";
			t3 = space();
			button2 = element("button");
			t4 = text("Soft");
			t5 = space();
			button3 = element("button");
			t6 = text("Sustain");
			t7 = space();
			div0 = element("div");
			t8 = text("Master Volume:\n    ");
			input0 = element("input");
			t9 = space();
			t10 = text(t10_value);
			t11 = space();
			div1 = element("div");
			t12 = text("Bass Volume:\n    ");
			input1 = element("input");
			t13 = space();
			t14 = text(t14_value);
			t15 = space();
			div2 = element("div");
			t16 = text("Treble Volume:\n    ");
			input2 = element("input");
			t17 = space();
			t18 = text(t18_value);
			attr(button0, "type", "button");
			attr(button1, "type", "button");
			attr(button2, "type", "button");
			attr(button2, "aria-pressed", button2_aria_pressed_value = /*$pedalling*/ ctx[2].soft);
			attr(button2, "class", "svelte-zgolxe");
			toggle_class(button2, "pedal-on", /*$pedalling*/ ctx[2].soft);
			attr(button3, "type", "button");
			attr(button3, "aria-pressed", button3_aria_pressed_value = /*$pedalling*/ ctx[2].sustain);
			attr(button3, "class", "svelte-zgolxe");
			toggle_class(button3, "pedal-on", /*$pedalling*/ ctx[2].sustain);
			attr(input0, "type", "range");
			attr(input0, "min", "0");
			attr(input0, "max", "4");
			attr(input0, "step", ".1");
			attr(input0, "name", "volume");
			attr(input1, "type", "range");
			attr(input1, "min", "0");
			attr(input1, "max", "4");
			attr(input1, "step", ".1");
			attr(input1, "name", "volume");
			attr(input2, "type", "range");
			attr(input2, "min", "0");
			attr(input2, "max", "4");
			attr(input2, "step", ".1");
			attr(input2, "name", "volume");
			attr(div3, "id", "score-controls");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, button0);
			append(div3, t1);
			append(div3, button1);
			append(div3, t3);
			append(div3, button2);
			append(button2, t4);
			append(div3, t5);
			append(div3, button3);
			append(button3, t6);
			append(div3, t7);
			append(div3, div0);
			append(div0, t8);
			append(div0, input0);
			set_input_value(input0, /*$volume*/ ctx[3].master);
			append(div0, t9);
			append(div0, t10);
			append(div3, t11);
			append(div3, div1);
			append(div1, t12);
			append(div1, input1);
			set_input_value(input1, /*$volume*/ ctx[3].left);
			append(div1, t13);
			append(div1, t14);
			append(div3, t15);
			append(div3, div2);
			append(div2, t16);
			append(div2, input2);
			set_input_value(input2, /*$volume*/ ctx[3].right);
			append(div2, t17);
			append(div2, t18);

			if (!mounted) {
				dispose = [
					listen(button0, "click", function () {
						if (is_function(/*playPauseMidiFile*/ ctx[0])) /*playPauseMidiFile*/ ctx[0].apply(this, arguments);
					}),
					listen(button1, "click", function () {
						if (is_function(/*stopMidiFile*/ ctx[1])) /*stopMidiFile*/ ctx[1].apply(this, arguments);
					}),
					listen(button2, "click", /*click_handler*/ ctx[4]),
					listen(button3, "click", /*click_handler_1*/ ctx[5]),
					listen(input0, "change", /*input0_change_input_handler*/ ctx[6]),
					listen(input0, "input", /*input0_change_input_handler*/ ctx[6]),
					listen(input1, "change", /*input1_change_input_handler*/ ctx[7]),
					listen(input1, "input", /*input1_change_input_handler*/ ctx[7]),
					listen(input2, "change", /*input2_change_input_handler*/ ctx[8]),
					listen(input2, "input", /*input2_change_input_handler*/ ctx[8])
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*$pedalling*/ 4 && button2_aria_pressed_value !== (button2_aria_pressed_value = /*$pedalling*/ ctx[2].soft)) {
				attr(button2, "aria-pressed", button2_aria_pressed_value);
			}

			if (dirty & /*$pedalling*/ 4) {
				toggle_class(button2, "pedal-on", /*$pedalling*/ ctx[2].soft);
			}

			if (dirty & /*$pedalling*/ 4 && button3_aria_pressed_value !== (button3_aria_pressed_value = /*$pedalling*/ ctx[2].sustain)) {
				attr(button3, "aria-pressed", button3_aria_pressed_value);
			}

			if (dirty & /*$pedalling*/ 4) {
				toggle_class(button3, "pedal-on", /*$pedalling*/ ctx[2].sustain);
			}

			if (dirty & /*$volume*/ 8) {
				set_input_value(input0, /*$volume*/ ctx[3].master);
			}

			if (dirty & /*$volume*/ 8 && t10_value !== (t10_value = /*$volume*/ ctx[3].master + "")) set_data(t10, t10_value);

			if (dirty & /*$volume*/ 8) {
				set_input_value(input1, /*$volume*/ ctx[3].left);
			}

			if (dirty & /*$volume*/ 8 && t14_value !== (t14_value = /*$volume*/ ctx[3].left + "")) set_data(t14, t14_value);

			if (dirty & /*$volume*/ 8) {
				set_input_value(input2, /*$volume*/ ctx[3].right);
			}

			if (dirty & /*$volume*/ 8 && t18_value !== (t18_value = /*$volume*/ ctx[3].right + "")) set_data(t18, t18_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div3);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $pedalling;
	let $volume;
	component_subscribe($$self, pedalling, $$value => $$invalidate(2, $pedalling = $$value));
	component_subscribe($$self, volume, $$value => $$invalidate(3, $volume = $$value));
	let { playPauseMidiFile } = $$props;
	let { stopMidiFile } = $$props;
	const click_handler = () => pedalling.update(val => ({ ...val, soft: !val.soft }));
	const click_handler_1 = () => pedalling.update(val => ({ ...val, sustain: !val.sustain }));

	function input0_change_input_handler() {
		$volume.master = to_number(this.value);
		volume.set($volume);
	}

	function input1_change_input_handler() {
		$volume.left = to_number(this.value);
		volume.set($volume);
	}

	function input2_change_input_handler() {
		$volume.right = to_number(this.value);
		volume.set($volume);
	}

	$$self.$$set = $$props => {
		if ("playPauseMidiFile" in $$props) $$invalidate(0, playPauseMidiFile = $$props.playPauseMidiFile);
		if ("stopMidiFile" in $$props) $$invalidate(1, stopMidiFile = $$props.stopMidiFile);
	};

	return [
		playPauseMidiFile,
		stopMidiFile,
		$pedalling,
		$volume,
		click_handler,
		click_handler_1,
		input0_change_input_handler,
		input1_change_input_handler,
		input2_change_input_handler
	];
}

class PlaybackControls extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { playPauseMidiFile: 0, stopMidiFile: 1 });
	}
}

export default PlaybackControls;
import './RollSelector.svelte.css.proxy.js';
/* src/components/RollSelector.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	add_render_callback,
	append,
	attr,
	destroy_each,
	detach,
	element,
	init,
	insert,
	listen,
	noop,
	safe_not_equal,
	select_option,
	select_value,
	text
} from "../_snowpack/pkg/svelte/internal.js";

import catalog from "../assets/catalog.json.proxy.js";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

// (16:2) {#each catalog as roll}
function create_each_block(ctx) {
	let option;
	let t_value = /*roll*/ ctx[2].title + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*roll*/ ctx[2];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment(ctx) {
	let select;
	let mounted;
	let dispose;
	let each_value = catalog;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(select, "class", "svelte-9htvim");
			if (/*currentRoll*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[1].call(select));
		},
		m(target, anchor) {
			insert(target, select, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, /*currentRoll*/ ctx[0]);

			if (!mounted) {
				dispose = listen(select, "change", /*select_change_handler*/ ctx[1]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*catalog*/ 0) {
				each_value = catalog;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*currentRoll, catalog*/ 1) {
				select_option(select, /*currentRoll*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(select);
			destroy_each(each_blocks, detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { currentRoll } = $$props;

	function select_change_handler() {
		currentRoll = select_value(this);
		$$invalidate(0, currentRoll);
	}

	$$self.$$set = $$props => {
		if ("currentRoll" in $$props) $$invalidate(0, currentRoll = $$props.currentRoll);
	};

	return [currentRoll, select_change_handler];
}

class RollSelector extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { currentRoll: 0 });
	}
}

export default RollSelector;
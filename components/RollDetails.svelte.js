import './RollDetails.svelte.css.proxy.js';
/* src/components/RollDetails.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	append,
	attr,
	component_subscribe,
	detach,
	element,
	init,
	insert,
	noop,
	safe_not_equal,
	set_data,
	space,
	text
} from "../_snowpack/pkg/svelte/internal.js";

import { rollMetadata } from "../stores.js";

function create_fragment(ctx) {
	let ul;
	let li0;
	let strong0;
	let t1;
	let t2_value = /*$rollMetadata*/ ctx[0].TITLE + "";
	let t2;
	let t3;
	let li1;
	let strong1;
	let t5;
	let t6_value = /*$rollMetadata*/ ctx[0].PERFORMER + "";
	let t6;
	let t7;
	let li2;
	let strong2;
	let t9;
	let t10_value = /*$rollMetadata*/ ctx[0].COMPOSER + "";
	let t10;
	let t11;
	let li3;
	let strong3;
	let t13;
	let t14_value = /*$rollMetadata*/ ctx[0].LABEL + "";
	let t14;
	let t15;
	let li4;
	let strong4;
	let t17;
	let a;
	let t18_value = /*$rollMetadata*/ ctx[0].PURL + "";
	let t18;
	let a_href_value;
	let t19;
	let li5;
	let strong5;
	let t21;
	let t22_value = /*$rollMetadata*/ ctx[0].CALLNUM + "";
	let t22;

	return {
		c() {
			ul = element("ul");
			li0 = element("li");
			strong0 = element("strong");
			strong0.textContent = "Title:";
			t1 = space();
			t2 = text(t2_value);
			t3 = space();
			li1 = element("li");
			strong1 = element("strong");
			strong1.textContent = "Performer:";
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			li2 = element("li");
			strong2 = element("strong");
			strong2.textContent = "Composer:";
			t9 = space();
			t10 = text(t10_value);
			t11 = space();
			li3 = element("li");
			strong3 = element("strong");
			strong3.textContent = "Label:";
			t13 = space();
			t14 = text(t14_value);
			t15 = space();
			li4 = element("li");
			strong4 = element("strong");
			strong4.textContent = "PURL:";
			t17 = space();
			a = element("a");
			t18 = text(t18_value);
			t19 = space();
			li5 = element("li");
			strong5 = element("strong");
			strong5.textContent = "Call No:";
			t21 = space();
			t22 = text(t22_value);
			attr(strong0, "class", "svelte-1l1fhvk");
			attr(strong1, "class", "svelte-1l1fhvk");
			attr(strong2, "class", "svelte-1l1fhvk");
			attr(strong3, "class", "svelte-1l1fhvk");
			attr(strong4, "class", "svelte-1l1fhvk");
			attr(a, "href", a_href_value = /*$rollMetadata*/ ctx[0].PURL);
			attr(strong5, "class", "svelte-1l1fhvk");
			attr(ul, "class", "svelte-1l1fhvk");
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			append(ul, li0);
			append(li0, strong0);
			append(li0, t1);
			append(li0, t2);
			append(ul, t3);
			append(ul, li1);
			append(li1, strong1);
			append(li1, t5);
			append(li1, t6);
			append(ul, t7);
			append(ul, li2);
			append(li2, strong2);
			append(li2, t9);
			append(li2, t10);
			append(ul, t11);
			append(ul, li3);
			append(li3, strong3);
			append(li3, t13);
			append(li3, t14);
			append(ul, t15);
			append(ul, li4);
			append(li4, strong4);
			append(li4, t17);
			append(li4, a);
			append(a, t18);
			append(ul, t19);
			append(ul, li5);
			append(li5, strong5);
			append(li5, t21);
			append(li5, t22);
		},
		p(ctx, [dirty]) {
			if (dirty & /*$rollMetadata*/ 1 && t2_value !== (t2_value = /*$rollMetadata*/ ctx[0].TITLE + "")) set_data(t2, t2_value);
			if (dirty & /*$rollMetadata*/ 1 && t6_value !== (t6_value = /*$rollMetadata*/ ctx[0].PERFORMER + "")) set_data(t6, t6_value);
			if (dirty & /*$rollMetadata*/ 1 && t10_value !== (t10_value = /*$rollMetadata*/ ctx[0].COMPOSER + "")) set_data(t10, t10_value);
			if (dirty & /*$rollMetadata*/ 1 && t14_value !== (t14_value = /*$rollMetadata*/ ctx[0].LABEL + "")) set_data(t14, t14_value);
			if (dirty & /*$rollMetadata*/ 1 && t18_value !== (t18_value = /*$rollMetadata*/ ctx[0].PURL + "")) set_data(t18, t18_value);

			if (dirty & /*$rollMetadata*/ 1 && a_href_value !== (a_href_value = /*$rollMetadata*/ ctx[0].PURL)) {
				attr(a, "href", a_href_value);
			}

			if (dirty & /*$rollMetadata*/ 1 && t22_value !== (t22_value = /*$rollMetadata*/ ctx[0].CALLNUM + "")) set_data(t22, t22_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(ul);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $rollMetadata;
	component_subscribe($$self, rollMetadata, $$value => $$invalidate(0, $rollMetadata = $$value));
	return [$rollMetadata];
}

class RollDetails extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

export default RollDetails;
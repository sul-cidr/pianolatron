import './App.svelte.css.proxy.js';
/* src/App.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	add_flush_callback,
	append,
	attr,
	bind,
	binding_callbacks,
	check_outros,
	component_subscribe,
	create_component,
	destroy_component,
	detach,
	element,
	group_outros,
	init,
	insert,
	mount_component,
	safe_not_equal,
	set_store_value,
	space,
	transition_in,
	transition_out
} from "./_snowpack/pkg/svelte/internal.js";

import {
	pedalling,
	volume,
	tempoControl,
	playbackProgress,
	activeNotes,
	currentTick
} from "./stores.js";

import { midiSamplePlayer, pianoReady } from "./components/SamplePlayer.js";
import RollSelector from "./components/RollSelector.svelte.js";
import RollDetails from "./components/RollDetails.svelte.js";
import PlaybackControls from "./components/PlaybackControls.svelte.js";
import RollViewer from "./components/RollViewer.svelte.js";
import Keyboard from "./components/Keyboard.svelte.js";
import Notification, { notify } from "./ui-components/Notification.svelte.js";

function create_if_block_1(ctx) {
	let rolldetails;
	let current;
	rolldetails = new RollDetails({});

	return {
		c() {
			create_component(rolldetails.$$.fragment);
		},
		m(target, anchor) {
			mount_component(rolldetails, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(rolldetails.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(rolldetails.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(rolldetails, detaching);
		}
	};
}

// (129:2) {#if appReady}
function create_if_block(ctx) {
	let div0;
	let playbackcontrols;
	let t0;
	let div1;
	let rollviewer;
	let t1;
	let div2;
	let keyboard;
	let current;

	playbackcontrols = new PlaybackControls({
			props: {
				playPauseApp: /*playPauseApp*/ ctx[2],
				stopApp: /*stopApp*/ ctx[3],
				skipToPercentage: /*skipToPercentage*/ ctx[4]
			}
		});

	rollviewer = new RollViewer({
			props: {
				imageUrl: /*currentRoll*/ ctx[1].image_url
			}
		});

	keyboard = new Keyboard({ props: { keyCount: "87", activeNotes } });

	return {
		c() {
			div0 = element("div");
			create_component(playbackcontrols.$$.fragment);
			t0 = space();
			div1 = element("div");
			create_component(rollviewer.$$.fragment);
			t1 = space();
			div2 = element("div");
			create_component(keyboard.$$.fragment);
			attr(div0, "id", "audio-controls");
			attr(div0, "class", "svelte-6exmy8");
			attr(div1, "id", "roll");
			attr(div1, "class", "svelte-6exmy8");
			attr(div2, "id", "keyboard");
			attr(div2, "class", "svelte-6exmy8");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			mount_component(playbackcontrols, div0, null);
			insert(target, t0, anchor);
			insert(target, div1, anchor);
			mount_component(rollviewer, div1, null);
			insert(target, t1, anchor);
			insert(target, div2, anchor);
			mount_component(keyboard, div2, null);
			current = true;
		},
		p(ctx, dirty) {
			const rollviewer_changes = {};
			if (dirty & /*currentRoll*/ 2) rollviewer_changes.imageUrl = /*currentRoll*/ ctx[1].image_url;
			rollviewer.$set(rollviewer_changes);
		},
		i(local) {
			if (current) return;
			transition_in(playbackcontrols.$$.fragment, local);
			transition_in(rollviewer.$$.fragment, local);
			transition_in(keyboard.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(playbackcontrols.$$.fragment, local);
			transition_out(rollviewer.$$.fragment, local);
			transition_out(keyboard.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			destroy_component(playbackcontrols);
			if (detaching) detach(t0);
			if (detaching) detach(div1);
			destroy_component(rollviewer);
			if (detaching) detach(t1);
			if (detaching) detach(div2);
			destroy_component(keyboard);
		}
	};
}

function create_fragment(ctx) {
	let div1;
	let div0;
	let rollselector;
	let updating_currentRoll;
	let t0;
	let t1;
	let t2;
	let notification;
	let current;

	function rollselector_currentRoll_binding(value) {
		/*rollselector_currentRoll_binding*/ ctx[5].call(null, value);
	}

	let rollselector_props = {};

	if (/*currentRoll*/ ctx[1] !== void 0) {
		rollselector_props.currentRoll = /*currentRoll*/ ctx[1];
	}

	rollselector = new RollSelector({ props: rollselector_props });
	binding_callbacks.push(() => bind(rollselector, "currentRoll", rollselector_currentRoll_binding));
	let if_block0 = /*appReady*/ ctx[0] && create_if_block_1(ctx);
	let if_block1 = /*appReady*/ ctx[0] && create_if_block(ctx);
	notification = new Notification({});

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			create_component(rollselector.$$.fragment);
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			t2 = space();
			create_component(notification.$$.fragment);
			attr(div0, "id", "roll-details");
			attr(div0, "class", "svelte-6exmy8");
			attr(div1, "id", "app");
			attr(div1, "class", "svelte-6exmy8");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			mount_component(rollselector, div0, null);
			append(div0, t0);
			if (if_block0) if_block0.m(div0, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
			insert(target, t2, anchor);
			mount_component(notification, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const rollselector_changes = {};

			if (!updating_currentRoll && dirty & /*currentRoll*/ 2) {
				updating_currentRoll = true;
				rollselector_changes.currentRoll = /*currentRoll*/ ctx[1];
				add_flush_callback(() => updating_currentRoll = false);
			}

			rollselector.$set(rollselector_changes);

			if (/*appReady*/ ctx[0]) {
				if (if_block0) {
					if (dirty & /*appReady*/ 1) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div0, null);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*appReady*/ ctx[0]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*appReady*/ 1) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(rollselector.$$.fragment, local);
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(notification.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(rollselector.$$.fragment, local);
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(notification.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(rollselector);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (detaching) detach(t2);
			destroy_component(notification, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $currentTick;
	component_subscribe($$self, currentTick, $$value => $$invalidate(8, $currentTick = $$value));
	let appReady = false;
	let mididataReady;
	let currentRoll;
	let previousRoll;

	const playPauseApp = () => {
		if (midiSamplePlayer.isPlaying()) {
			midiSamplePlayer.pause();
			activeNotes.reset();
		} else {
			midiSamplePlayer.play();
		}
	};

	const stopApp = () => {
		midiSamplePlayer.stop();
		playbackProgress.set(0);
		currentTick.set(0);
		activeNotes.reset();
	};

	const resetApp = () => {
		$$invalidate(6, mididataReady = false);
		$$invalidate(0, appReady = false);
		stopApp();
		tempoControl.set(60);
		pedalling.set({ soft: false, sustain: false });
		volume.set({ master: 1, left: 1, right: 1 });
	};

	const skipToTick = tick => {
		set_store_value(currentTick, $currentTick = tick, $currentTick);

		if (midiSamplePlayer.isPlaying()) {
			midiSamplePlayer.pause();
			midiSamplePlayer.skipToTick($currentTick);
			midiSamplePlayer.play();
		} else {
			midiSamplePlayer.skipToTick($currentTick);
		}
	};

	const skipToPercentage = percentage => skipToTick(midiSamplePlayer.totalTicks * percentage);

	const loadRoll = roll => {
		$$invalidate(6, mididataReady = fetch(`./assets/midi/${roll.druid}.mid`).then(mididataResponse => {
			if (mididataResponse.status === 200) return mididataResponse.arrayBuffer();
			throw new Error("Error fetching MIDI file! (Operation cancelled)");
		}).then(mididataArrayBuffer => {
			resetApp();
			midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);

			Promise.all([mididataReady, pianoReady]).then(() => {
				$$invalidate(0, appReady = true);
			});
		}).catch(err => {
			notify({
				title: "Error!",
				message: err,
				type: "error"
			});

			$$invalidate(1, currentRoll = previousRoll);
		}));
	};

	function rollselector_currentRoll_binding(value) {
		currentRoll = value;
		$$invalidate(1, currentRoll);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*currentRoll, previousRoll, mididataReady*/ 194) {
			$: {
				if (currentRoll !== previousRoll) {
					loadRoll(currentRoll);

					mididataReady.then(() => {
						$$invalidate(7, previousRoll = currentRoll);
					});
				}
			}
		}

		if ($$self.$$.dirty & /*$currentTick*/ 256) {
			$: playbackProgress.update(() => $currentTick / midiSamplePlayer.totalTicks);
		}
	};

	return [
		appReady,
		currentRoll,
		playPauseApp,
		stopApp,
		skipToPercentage,
		rollselector_currentRoll_binding
	];
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

export default App;
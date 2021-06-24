/** @type {import('@sveltejs/kit').Config} */

import sveltePreprocess from "svelte-preprocess";

const config = {
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@use "sass:math";@import 'src/styles/globals.scss';`,
    },
  }),
};

export default config;

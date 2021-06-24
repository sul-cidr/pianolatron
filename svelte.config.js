/** @type {import('@sveltejs/kit').Config} */

import sveltePreprocess from "svelte-preprocess";

const config = {
  kit: {
    target: "body",
  },
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@use "sass:math";@import 'src/styles/globals.scss';`,
    },
  }),
};

export default config;

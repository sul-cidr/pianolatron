const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@use "sass:math";@import 'src/styles/globals.scss';`,
    },
  }),
};

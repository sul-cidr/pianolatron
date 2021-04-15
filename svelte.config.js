const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@import 'src/globals.scss';@import 'src/functions.scss';`,
    },
  }),
};

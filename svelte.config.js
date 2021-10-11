const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  preprocess: sveltePreprocess({
    scss: {
      prependData: `@use "sass:math";@use 'src/styles/sass-globals.scss' as *;`,
    },
  }),
};

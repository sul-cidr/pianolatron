/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: "/",
  },
  plugins: ["@snowpack/plugin-svelte"],
  preprocess: require("svelte-preprocess")(),
  routes: [],
  optimize: {},
  packageOptions: {},
  devOptions: {
    open: "none",
  },
  buildOptions: { baseUrl: "/pianolatron" },
};

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: "/",
  },
  plugins: ["@snowpack/plugin-svelte"],
  routes: [],
  optimize: {},
  packageOptions: {},
  devOptions: {
    open: "none",
  },
  buildOptions: { baseUrl: "/pianolatron" },
};

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: "/",
  },
  plugins: ["@snowpack/plugin-svelte", "@snowpack/plugin-sass"],
  routes: [],
  optimize: {},
  packageOptions: {},
  devOptions: {
    open: "none",
  },
  buildOptions: { baseUrl: "/pianolatron" },
};

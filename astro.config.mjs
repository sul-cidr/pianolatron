import { defineConfig } from "astro/config";

import svelte from "@astrojs/svelte";
import preprocess from "svelte-preprocess";

export default defineConfig({
  site: "https://pianolatron.stanford.edu/",
  base: "/",
  trailingSlash: "always",
  server: { port: 8080 },
  integrations: [
    svelte({
      preprocess: [
        preprocess.scss({
          prependData: `@use "sass:math";@use 'src/styles/sass-globals.scss' as *;`,
        }),
      ],
    }),
  ],
});

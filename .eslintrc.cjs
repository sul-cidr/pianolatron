module.exports = {
  root: true,
  plugins: ["svelte3"],
  extends: ["airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    es6: true,
    browser: true,
  },
  overrides: [
    {
      files: ["**/*.svelte"],
      processor: "svelte3/svelte3",
    },
  ],
  rules: {
    "no-cond-assign": ["error", "except-parens"],
    "no-param-reassign": ["error", { props: false }],
    "no-return-assign": ["error", "except-parens"],
    "no-undef-init": "off",
    "no-underscore-dangle": "off",
    // see https://github.com/sveltejs/eslint-plugin-svelte3/blob/master/OTHER_PLUGINS.md#eslint-plugin-import
    "import/first": "off",
    "import/no-mutable-exports": "off",
    "import/prefer-default-export": "off",
    "import/no-duplicates": "off",
  },
  settings: {
    "svelte3/ignore-styles": (attribs) => "lang" in attribs,
  },
};

module.exports = {
  root: true,
  plugins: ["svelte3"],
  extends: ["airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
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
    "lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true },
    ],
  },
  settings: {
    "svelte3/ignore-styles": (attribs) => "lang" in attribs,
    "import/resolver": {
      node: {
        extensions: [".d.ts"],
      },
    },
  },
};

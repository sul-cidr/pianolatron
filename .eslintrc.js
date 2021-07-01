module.exports = {
  root: true,
  plugins: ["svelte3", "jsx-a11y"],
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
    "no-underscore-dangle": "off",
    "no-return-assign": ["error", "except-parens"],
    "no-cond-assign": ["error", "except-parens"],
    "jsx-a11y/label-has-for": [
      "error",
      {
        components: ["Label"],
        required: {
          some: ["nesting", "id"],
        },
      },
    ],
    "import/first": "off", // import order cannot be determined correctly in .svelte components
    "import/no-mutable-exports": "off",
    "import/prefer-default-export": "off",
  },
  settings: {
    "svelte3/ignore-styles": (attribs) => "lang" in attribs,
  },
};

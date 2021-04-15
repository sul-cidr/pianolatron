module.exports = {
  plugins: ["svelte3", "jsx-a11y"],
  extends: ["airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: 2019,
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
    "no-underscore-dangle": 0,
    "jsx-a11y/label-has-for": [
      2,
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
};

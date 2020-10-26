module.exports = {
  roots: ["./__tests__/", "src/"],
  coverageDirectory: "./coverage/",
  collectCoverageFrom: [
    "src/*.{js,svelte}",
    "src/**/*.{js,svelte}",
    "!**/node_modules/**",
  ],
  transform: {
    "^.+\\.svelte$": "svelte-jester",
    "^.+\\.js$": "babel-jest",
  },
  moduleFileExtensions: ["js", "svelte"],
  bail: false,
  verbose: true,
};

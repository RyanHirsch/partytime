module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "\\.(ts)$": "esbuild-runner/jest",
  },
  cacheDirectory: ".jest/cache",
  testMatch: ["**/*.test.(ts|js)"],
  testEnvironment: "node",
  testTimeout: 10_000,
};

module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "\\.(ts)$": "ts-jest",
  },
  cacheDirectory: ".jest/cache",
  testMatch: ["**/*.test.(ts|js)"],
  testEnvironment: "node",
};

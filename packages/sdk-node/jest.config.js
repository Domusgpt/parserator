module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.test.(js < /dev/null | ts)",
    "**/?(*.)+(spec|test).(js|ts)"
  ],
  collectCoverageFrom: [
    "src/**/*.{js,ts}",
    "\!src/**/*.d.ts",
    "\!src/**/*.test.{js,ts}",
    "\!src/**/index.ts"
  ],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: [],
  testTimeout: 30000
};

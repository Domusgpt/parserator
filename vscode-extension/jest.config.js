module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  // Automatically mock the vscode API for all unit tests
  setupFilesAfterEnv: ['<rootDir>/src/test/vscodeMock.ts'], // if using a global mock setup file
  // Or mock individually in test files. For now, let's assume individual mocking or direct jest.mock in tests.
  moduleNameMapper: {
    // If using file: paths for local packages and Jest has trouble:
    // Ensure paths match how they are resolved from vscode-extension
    "^@parserator/core-api-client$": "<rootDir>/../packages/core-api-client/src/index.ts", // Adjust path as necessary
    "^@parserator/types$": "<rootDir>/../packages/types/index.ts" // Adjust path as necessary
  }
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Use jsdom for browser-like environment
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.base.json' // Ensure it uses a tsconfig that includes src (base or esm/cjs)
    }]
  },
  moduleNameMapper: {
    // If @parserator/core-api-client or @parserator/types are not resolved correctly by Node resolution
    // (e.g. if they are locally linked and not via npm/yarn workspaces in a way Jest understands),
    // you might need to map them here.
    // Example:
    // "^@parserator/core-api-client$": "<rootDir>/../core-api-client/src/index.ts",
    // "^@parserator/types$": "<rootDir>/../types/index.ts"
    // For now, assume standard resolution or monorepo tooling handles this.
  },
  // collectCoverage: true,
  // coverageDirectory: "coverage",
};

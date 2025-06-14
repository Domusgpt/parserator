module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json' // Ensure it uses the correct tsconfig for tests
    }]
  },
  moduleNameMapper: {
    // If you have module aliases in tsconfig.json, map them here
    // e.g., "@parserator/types": "<rootDir>/../types/index.ts"
    // This might be needed if Jest doesn't resolve the @parserator/types dependency correctly
    // For now, assuming standard Node module resolution works or will be handled by pnpm/yarn workspaces.
    // If using relative paths for @parserator/types in package.json, adjust accordingly.
    // Example for a local linked package if not using workspaces:
    // "^@parserator/types$": "<rootDir>/../types/src/index.ts" // Adjust path as necessary
  },
  // collectCoverage: true, // Uncomment to enable coverage reports
  // coverageDirectory: "coverage",
  // coverageReporters: ["json", "lcov", "text", "clover"]
};

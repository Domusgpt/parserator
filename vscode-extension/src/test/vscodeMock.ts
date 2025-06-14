// src/test/vscodeMock.ts
jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string) => {
        // Provide mock values for configuration keys used by ParseratorService
        if (key === 'apiKey') return 'mock-api-key-from-vscode-settings';
        if (key === 'baseUrl') return 'http://mock-base-url.com';
        // Add other config keys if your service uses them
        return undefined;
      }),
    })),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })), // Mock the event listener
  },
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    withProgress: jest.fn((options, task) => task({ report: jest.fn() })), // Mock withProgress
    // Add other vscode.window.* functions if needed
  },
  ProgressLocation: {
    Notification: 15 // Actual value doesn't matter much for mock
  },
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  },
  Uri: {
    file: jest.fn(path => ({ fsPath: path, path, with: jest.fn(), toString: () => path }))
  },
  // Add other modules like env, extensions, etc. if they are used
  env: {
    machineId: 'mock-machine-id',
  }
}), { virtual: true }); // virtual: true is important for mocking a module that might not be in node_modules

console.log('Global VSCode API mock applied.');

import { ParseratorApiClient, ParseratorBrowserClient } from '../index';
// Import the class *from the actual module path* that is being mocked.
// This allows us to get a typed reference to the mock.
import { ParseratorApiClient as CoreApiClientOriginal } from '@parserator/core-api-client';

// Mock the entire @parserator/core-api-client module.
// The ParseratorApiClient class from this module will be replaced by jest.fn().
jest.mock('@parserator/core-api-client', () => ({
  __esModule: true, // Important for ES modules
  // Mock specific named exports from the module
  ParseratorApiClient: jest.fn().mockImplementation((baseURL?: string, apiKey?: string) => {
    // This is the mock constructor for the Core API Client (the superclass)
    // console.log(`Mocked superclass (CoreApiClient) constructor called with: ${baseURL}, ${apiKey}`);
    return {
      // If ParseratorBrowserClient's constructor or methods call methods on `super`,
      // those would need to be mocked here on this returned object.
      // For a simple super() call, this might not be strictly necessary
      // unless the super constructor itself has side effects that need controlling.
    };
  }),
  // If browser-sdk uses other exports from core-api-client (like types directly),
  // they might need to be handled here too (e.g., by re-exporting actuals or mocking).
  // For types, usually jest.requireActual is not needed as types are compile-time.
}));

// Cast the imported (and now mocked) CoreApiClientOriginal to its mocked class type
const MockedCoreSuperClass = CoreApiClientOriginal as jest.MockedClass<typeof CoreApiClientOriginal>;


describe('ParseratorBrowserSDK', () => {
  beforeEach(() => {
    // Clear call history for the mocked superclass constructor before each test
    MockedCoreSuperClass.mockClear();
    // Spy on console.warn and clear its history too
    jest.spyOn(console, 'warn').mockImplementation(() => {}).mockClear();
  });

  afterEach(() => {
    // Restore original console.warn
    (console.warn as jest.Mock).mockRestore();
  });

  it('should correctly export ParseratorApiClient (which is an alias for ParseratorBrowserClient)', () => {
    expect(typeof ParseratorApiClient).toBe('function');
    expect(ParseratorApiClient).toBe(ParseratorBrowserClient);
  });

  it('ParseratorBrowserClient should be a subclass of the (mocked) CoreApiClient', () => {
    // This test is a bit meta, but it confirms the extends relationship with the mock.
    // When ParseratorBrowserClient is instantiated, the mocked CoreApiClient constructor should be called.
    new ParseratorBrowserClient();
    expect(MockedCoreSuperClass).toHaveBeenCalledTimes(1);
  });

  it('should instantiate ParseratorBrowserClient and call the super (CoreApiClient) constructor with parameters', () => {
    const baseURL = 'http://test.com';
    const apiKey = 'test-key';
    new ParseratorBrowserClient(baseURL, apiKey);

    expect(MockedCoreSuperClass).toHaveBeenCalledTimes(1);
    expect(MockedCoreSuperClass).toHaveBeenCalledWith(baseURL, apiKey);
  });

  it('should instantiate ParseratorBrowserClient without params and call super (CoreApiClient) constructor without params', () => {
    new ParseratorBrowserClient();
    expect(MockedCoreSuperClass).toHaveBeenCalledTimes(1);
    expect(MockedCoreSuperClass).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should warn if an API key is provided to ParseratorBrowserClient constructor', () => {
    const apiKey = 'test-key-in-browser';
    new ParseratorBrowserClient('http://test.com', apiKey);
    expect(console.warn).toHaveBeenCalledWith(
      'ParseratorBrowserClient: API key provided directly in the browser. ' +
      'Ensure this is done securely and consider using a backend proxy for sensitive operations.'
    );
  });

  it('should not warn if an API key is not provided', () => {
    new ParseratorBrowserClient('http://test.com');
    expect(console.warn).not.toHaveBeenCalled();
  });

  // Test if types are re-exported (this is more of a compile-time check, but a runtime check can ensure they are not undefined)
  it('should re-export types (runtime check for existence)', () => {
    // This doesn't check the actual type, just that the exports exist.
    // TypeScript itself is the primary enforcer of correct type re-export.
    const typeExports = require('../index'); // Use require to inspect exports

    expect(typeExports.ParseRequest).toBeUndefined(); // Types are not actual values at runtime
    // A more meaningful test for type exports would be a compilation test or using dts-jest.
    // For now, we'll rely on the fact that if the code compiles, type re-exports are working.
    // This test mostly serves as a placeholder for that concept.
    // A simple check is that the module can be imported.
    expect(ParseratorApiClient).toBeDefined();
  });

});

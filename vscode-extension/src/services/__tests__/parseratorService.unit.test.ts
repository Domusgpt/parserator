import { ParseratorService, VSCodeParseratorError } from '../parseratorService';
import { ParseratorApiClient, ParseRequest, ParseResponse, ApiError, SavedSchema, UpsertSchemaRequest } from '@parserator/core-api-client';

// vscode module is globally mocked via jest.config.js setupFilesAfterEnv (src/test/vscodeMock.ts)

// Define Jest mock functions for each method of ParseratorApiClient at the module scope
const mockParseFn = jest.fn();
const mockGetSchemaFn = jest.fn();
const mockUpsertSchemaFn = jest.fn();

// Mock the core API client that the service uses
jest.mock('@parserator/core-api-client', () => ({
  __esModule: true,
  ParseratorApiClient: jest.fn().mockImplementation(() => ({ // This is the mock constructor
    parse: mockParseFn,                 // Instance methods are these specific jest.fn()
    getSchema: mockGetSchemaFn,
    upsertSchema: mockUpsertSchemaFn,
    // No testConnection method in core-api-client, so ParseratorService will use getSchema for it.
  })),
}));

// Get a typed reference to the MOCKED ParseratorApiClient constructor
const MockedParseratorApiClientConstructor = ParseratorApiClient as jest.MockedClass<typeof ParseratorApiClient>;


describe('ParseratorService Unit Tests', () => {
  let service: ParseratorService;
  // We don't need mockApiClientInstance anymore, we'll use mockParseFn, mockGetSchemaFn etc. directly.

  beforeEach(() => {
    // Clear all mock function call histories
    mockParseFn.mockClear();
    mockGetSchemaFn.mockClear();
    mockUpsertSchemaFn.mockClear();
    MockedParseratorApiClientConstructor.mockClear(); // Clear calls to the constructor itself

    // Create a new service instance for each test.
    // This will call the mocked ParseratorApiClient constructor.
    service = new ParseratorService();
  });

  it('should be configurable via vscode settings and instantiate the ApiClient', () => {
    // ParseratorService constructor calls updateConfiguration, which should instantiate the client
    expect(MockedParseratorApiClientConstructor).toHaveBeenCalledTimes(1);
    expect(MockedParseratorApiClientConstructor).toHaveBeenCalledWith(
      'http://mock-base-url.com', // From vscodeMock.ts
      'mock-api-key-from-vscode-settings' // From vscodeMock.ts
    );
    expect(service.isConfigured()).toBe(true);
  });

  describe('parse', () => {
    it('should call apiClient.parse with correct parameters', async () => {
      const parseOptions = { text: 'test data', schema: { field: 'string' } };
      const mockApiResponse: ParseResponse = { success: true, result: { field: 'parsed data' } };
      mockParseFn.mockResolvedValue(mockApiResponse);

      const result = await service.parse(parseOptions);

      expect(mockParseFn).toHaveBeenCalledWith({
        text: parseOptions.text,
        schema: parseOptions.schema,
        schemaId: undefined, // as not provided in options
        model: undefined,    // as not provided in options
      });
      expect(result).toEqual(mockApiResponse);
    });

    it('should throw VSCodeParseratorError if apiClient.parse rejects with ApiError', async () => {
      const parseOptions = { text: 'test data', schema: { field: 'string' } };
      const mockApiError: ApiError = { code: 'API_ERR', message: 'API parse failed' };
      mockParseFn.mockRejectedValue(mockApiError);

      await expect(service.parse(parseOptions)).rejects.toThrow(VSCodeParseratorError);
      await expect(service.parse(parseOptions)).rejects.toMatchObject({
        code: 'API_ERR',
        message: 'API parse failed',
      });
    });

    it('should throw VSCodeParseratorError for validation errors before API call (empty text)', async () => {
        const invalidOptions: any = { text: '', schema: {} }; // Empty text
        await expect(service.parse(invalidOptions)).rejects.toThrow(VSCodeParseratorError);
        // Based on current validation logic, an empty string "" triggers !options.text first
        await expect(service.parse(invalidOptions)).rejects.toMatchObject({ code: 'INVALID_INPUT_DATA' });
    });

    it('should throw VSCodeParseratorError for validation errors before API call (whitespace only text)', async () => {
        const invalidOptions: any = { text: '   ', schema: {} }; // Whitespace only text
        await expect(service.parse(invalidOptions)).rejects.toThrow(VSCodeParseratorError);
        // This should pass the first check and fail on trim().length === 0
        await expect(service.parse(invalidOptions)).rejects.toMatchObject({ code: 'EMPTY_INPUT_DATA' });
    });
  });

  describe('getSchema', () => {
    it('should call apiClient.getSchema and return schema data', async () => {
        const schemaId = 'test-id';
        const mockSavedSchema: SavedSchema = { id: schemaId, name: 'Test', schema: {}, createdAt: new Date(), updatedAt: new Date() };
        mockGetSchemaFn.mockResolvedValue(mockSavedSchema);

        const result = await service.getSchema(schemaId);
        expect(mockGetSchemaFn).toHaveBeenCalledWith(schemaId);
        expect(result).toEqual(mockSavedSchema);
    });
  });

  describe('upsertSchema', () => {
    it('should call apiClient.upsertSchema for creating a new schema', async () => {
        const schemaData: UpsertSchemaRequest = { name: 'New Schema', schema: { type: 'string' }};
        const mockSavedSchema: SavedSchema = { id: 'new-id', ...schemaData, createdAt: new Date(), updatedAt: new Date() };
        mockUpsertSchemaFn.mockResolvedValue(mockSavedSchema);

        const result = await service.upsertSchema(schemaData);
        expect(mockUpsertSchemaFn).toHaveBeenCalledWith(schemaData, undefined);
        expect(result).toEqual(mockSavedSchema);
    });
  });

  describe('testConnection', () => {
    it('should return true if apiClient.getSchema resolves (even with "not_found" style error)', async () => {
      // Simulate API responding (e.g. a "not_found" error is still a response)
      const mockNotFoundError: ApiError = { code: 'not_found', message: 'Schema not found' };
      mockGetSchemaFn.mockRejectedValue(mockNotFoundError);

      const isConnected = await service.testConnection();
      expect(mockGetSchemaFn).toHaveBeenCalledWith('__test_connection__');
      expect(isConnected).toBe(true);
    });

    it('should return false if apiClient.getSchema rejects with network error', async () => {
      const mockNetworkError: ApiError = { code: 'network_error', message: 'Network issue' };
      mockGetSchemaFn.mockRejectedValue(mockNetworkError);

      const isConnected = await service.testConnection();
      expect(isConnected).toBe(false);
    });
     it('should return false if not configured (no API key)', async () => {
      // Temporarily mock getConfiguration to return no API key
      const vscode = require('vscode');
      vscode.workspace.getConfiguration.mockReturnValueOnce({
        get: jest.fn((key: string) => {
          if (key === 'apiKey') return ''; // No API key
          return undefined;
        }),
      });
      const unconfiguredService = new ParseratorService(); // Create new instance with this config
      const isConnected = await unconfiguredService.testConnection();
      expect(isConnected).toBe(false);
    });
  });
});

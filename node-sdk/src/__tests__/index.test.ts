import { ParseratorNodeSDK, ParseRequest, ParseResponse, UpsertSchemaRequest, SavedSchema } from '../index'; // Adjust path if your actual output structure is different
import { ParseratorApiClient } from '@parserator/core-api-client';

// Mock the core-api-client
jest.mock('@parserator/core-api-client');

const MockParseratorApiClient = ParseratorApiClient as jest.MockedClass<typeof ParseratorApiClient>;

describe('ParseratorNodeSDK', () => {
  let sdk: ParseratorNodeSDK;
  let mockApiClientInstance: jest.Mocked<ParseratorApiClient>;

  const MOCK_API_KEY = 'test-sdk-api-key';
  const MOCK_BASE_URL = 'http://fake-sdk-parserator-api.com/v1';

  beforeEach(() => {
    // Clear all previous mock data and calls
    MockParseratorApiClient.mockClear();

    // Setup the mock implementation for the constructor and methods
    // Get the first (and only) instance that was created by `new ParseratorNodeSDK()`
    // This relies on ParseratorNodeSDK constructor calling new ParseratorApiClient()
    if (MockParseratorApiClient.mock.instances[0]) {
        mockApiClientInstance = MockParseratorApiClient.mock.instances[0] as jest.Mocked<ParseratorApiClient>;
    } else {
        // If no instance yet, this means the constructor of ParseratorNodeSDK itself might be failing
        // or the test setup needs adjustment. For now, we'll create a manual mock instance
        // to allow tests to proceed, but this indicates a potential issue in how
        // the mock setup interacts with the class under test.
        // This manual mock setup is a fallback. Ideally, the constructor call in SDK
        // should result in MockParseratorApiClient.mock.instances[0] being populated.
        mockApiClientInstance = {
            parse: jest.fn(),
            getSchema: jest.fn(),
            upsertSchema: jest.fn(),
        } as any; // Cast to any to satisfy the type, actual methods are mocked
    }


    // Configure default API key via env for some tests
    process.env.PARSERATOR_API_KEY = MOCK_API_KEY;
    sdk = new ParseratorNodeSDK({ baseURL: MOCK_BASE_URL });

    // After creating an SDK instance, the ParseratorApiClient constructor should have been called.
    // We then access this mocked instance to spy on its methods.
    // This is a common pattern for testing classes that instantiate other classes.
     if (MockParseratorApiClient.mock.instances.length > 0) {
      mockApiClientInstance = MockParseratorApiClient.mock.instances[0] as jest.Mocked<ParseratorApiClient>;
    } else {
      // This case should ideally not be hit if the constructor of ParseratorNodeSDK
      // correctly instantiates ParseratorApiClient.
      // Re-assigning to ensure mockApiClientInstance is the one used by the sdk instance.
      // This can happen if the mock setup isn't perfectly aligned with instantiation order.
      // For robust testing, ensure the mock is available before or right after instantiation.
      // A more direct approach might be to inject the client, but we test the current design.
       mockApiClientInstance = {
            parse: jest.fn(),
            getSchema: jest.fn(),
            upsertSchema: jest.fn(),
        } as any;
       (sdk as any).apiClient = mockApiClientInstance; // Manually inject if necessary, not ideal
    }


  });

  afterEach(() => {
    delete process.env.PARSERATOR_API_KEY; // Clean up env variable
  });

  it('should instantiate ParseratorApiClient with baseURL and apiKey from constructor', () => {
    const specificApiKey = 'specific-key';
    new ParseratorNodeSDK({ baseURL: MOCK_BASE_URL, apiKey: specificApiKey });
    expect(MockParseratorApiClient).toHaveBeenCalledWith(MOCK_BASE_URL, specificApiKey);
  });

  it('should instantiate ParseratorApiClient with apiKey from environment if not in config', () => {
    new ParseratorNodeSDK({ baseURL: MOCK_BASE_URL });
    expect(MockParseratorApiClient).toHaveBeenCalledWith(MOCK_BASE_URL, MOCK_API_KEY);
  });

  it('should warn if no API key is provided', () => {
    delete process.env.PARSERATOR_API_KEY;
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    new ParseratorNodeSDK();
    expect(MockParseratorApiClient).toHaveBeenCalledWith(undefined, undefined); // No base URL, no API key
    expect(consoleWarnSpy).toHaveBeenCalledWith('Parserator API Key not provided. Some operations may fail. Set PARSERATOR_API_KEY environment variable or provide in config.');
    consoleWarnSpy.mockRestore();
  });

  describe('parse', () => {
    it('should call apiClient.parse with the given request', async () => {
      const request: ParseRequest = { text: 'parse this', schema: { item: 'string' } };
      const expectedResponse: ParseResponse = { success: true, result: { item: 'parsed this' } };
      mockApiClientInstance.parse.mockResolvedValueOnce(expectedResponse);

      const result = await sdk.parse(request);

      expect(mockApiClientInstance.parse).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSchema', () => {
    it('should call apiClient.getSchema with the given schemaId', async () => {
      const schemaId = 's123';
      const expectedSchema: SavedSchema = {
        id: schemaId, name: 'My Schema', schema: {},
        createdAt: new Date(), updatedAt: new Date()
      };
      mockApiClientInstance.getSchema.mockResolvedValueOnce(expectedSchema);

      const result = await sdk.getSchema(schemaId);

      expect(mockApiClientInstance.getSchema).toHaveBeenCalledWith(schemaId);
      expect(result).toEqual(expectedSchema);
    });
  });

  describe('upsertSchema', () => {
    it('should call apiClient.upsertSchema with schema data for create', async () => {
      const request: UpsertSchemaRequest = { name: 'New Schema', schema: { data: 'string' } };
      const expectedSchema: SavedSchema = {
        id: 'newId', ...request,
        createdAt: new Date(), updatedAt: new Date()
      };
      mockApiClientInstance.upsertSchema.mockResolvedValueOnce(expectedSchema);

      const result = await sdk.upsertSchema(request);

      expect(mockApiClientInstance.upsertSchema).toHaveBeenCalledWith(request, undefined);
      expect(result).toEqual(expectedSchema);
    });

    it('should call apiClient.upsertSchema with schema data and ID for update', async () => {
      const schemaId = 's456';
      const request: UpsertSchemaRequest = { name: 'Updated Schema', schema: { data: 'number' } };
      const expectedSchema: SavedSchema = {
        id: schemaId, ...request,
        createdAt: new Date(), updatedAt: new Date()
      };
      mockApiClientInstance.upsertSchema.mockResolvedValueOnce(expectedSchema);

      const result = await sdk.upsertSchema(request, schemaId);

      expect(mockApiClientInstance.upsertSchema).toHaveBeenCalledWith(request, schemaId);
      expect(result).toEqual(expectedSchema);
    });
  });
});

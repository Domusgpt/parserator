import axios from 'axios';
import { ParseratorApiClient } from '../client';
import { ParseRequest, ParseResponse, ApiError, UpsertSchemaRequest, SavedSchema } from '@parserator/types';

// Mock axios
import axios from 'axios'; // Import before ParseratorApiClient
import { ParseratorApiClient } from '../client';
import { ParseRequest, ParseResponse, ApiError, UpsertSchemaRequest, SavedSchema } from '@parserator/types';

jest.mock('axios'); // This will be hoisted

// Create a reusable mock for the AxiosInstance methods and interceptors
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  // Add other methods like delete, patch if your client uses them
};

// Configure the mock for axios.create to return our mockAxiosInstance
// This needs to be done at the module level, before describe/beforeEach
(axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);


describe('ParseratorApiClient', () => {
  let client: ParseratorApiClient;
  const MOCK_API_KEY = 'test-api-key';
  const MOCK_BASE_URL = 'http://fake-parserator-api.com/v1';

  beforeEach(() => {
    // Reset mocks on the instance methods before each test
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.get.mockClear();
    mockAxiosInstance.put.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();
    // also clear request interceptor if used by client
    mockAxiosInstance.interceptors.request.use.mockClear();

    // Re-initialize client for each test to ensure clean state and constructor logic runs
    client = new ParseratorApiClient(MOCK_BASE_URL, MOCK_API_KEY);
  });

  it('should create an axios instance with correct baseURL and headers and setup interceptor', () => {
    // Verify axios.create was called by the constructor (implicitly, due to mock setup)
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: MOCK_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_API_KEY}`,
      },
    });
    // Check if interceptor was set up on the mock
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  describe('parse', () => {
    it('should make a POST request to /parse and return data on success (ParseResponse style)', async () => {
      const request: ParseRequest = { text: 'test', schema: { type: 'string' } };
      const expectedResponseData: ParseResponse = { success: true, result: { data: 'parsed' } };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: expectedResponseData });

      const result = await client.parse(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/parse', request);
      expect(result).toEqual(expectedResponseData);
    });

    it('should make a POST request to /parse and return data on success (direct result style)', async () => {
      const request: ParseRequest = { text: 'test', schema: { type: 'string' } };
      const rawApiResponse = { data: 'parsed' };
      const expectedResponseData: ParseResponse = { success: true, result: rawApiResponse };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: rawApiResponse });

      const result = await client.parse(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/parse', request);
      expect(result).toEqual(expectedResponseData);
    });

    it('should handle API error correctly processed by interceptor', async () => {
      const request: ParseRequest = { text: 'test', schema: {} };
      const apiErrorPayload: ApiError = { code: 'parse_error', message: 'Failed to parse from API' };

      // Simulate an AxiosError that the interceptor will process
      const axiosError = {
        isAxiosError: true,
        response: { // This data will be extracted by the interceptor
          data: apiErrorPayload,
          status: 400, headers: {}, config: {} as any
        },
        message: "Request failed with status code 400" // Original Axios message
      };

      mockAxiosInstance.post.mockRejectedValueOnce(axiosError);

      // The client's parse method should ultimately throw an error matching apiErrorPayload
      // because the interceptor extracts it from axiosError.response.data
      await expect(client.parse(request)).rejects.toMatchObject(apiErrorPayload);
    });
  });

  describe('getSchema', () => {
    it('should make a GET request to /schemas/:id and return schema data', async () => {
      const schemaId = 'test-schema-id';
      const expectedResponseData: SavedSchema = {
        id: schemaId, name: 'Test Schema', schema: { type: 'object' },
        createdAt: new Date(), updatedAt: new Date()
      };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { success: true, data: expectedResponseData } });

      const result = await client.getSchema(schemaId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/schemas/${schemaId}`);
      expect(result).toEqual(expectedResponseData);
    });

    it('should handle API error if success is false for getSchema', async () => {
      const schemaId = 'test-schema-id';
       mockAxiosInstance.get.mockResolvedValueOnce({ data: { success: false, error: 'Not found' } });

      await expect(client.getSchema(schemaId)).rejects.toMatchObject({
          code: 'fetch_error',
          message: 'Not found',
      });
    });

    it('should handle thrown error for getSchema', async () => {
      const schemaId = 'test-schema-id';
      const apiError: ApiError = { code: 'network_error', message: 'Network issue' };
      mockAxiosInstance.get.mockRejectedValueOnce(apiError); // Assume interceptor already processed it

      await expect(client.getSchema(schemaId)).rejects.toEqual(apiError);
    });
  });

  describe('upsertSchema', () => {
    it('should POST to /schemas for new schema and return data', async () => {
      const request: UpsertSchemaRequest = { name: 'New Schema', schema: { type: 'string' } };
      const expectedResponseData: SavedSchema = {
        id: 'new-id', ...request,
        createdAt: new Date(), updatedAt: new Date()
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true, data: expectedResponseData } });

      const result = await client.upsertSchema(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/schemas', request);
      expect(result).toEqual(expectedResponseData);
    });

    it('should PUT to /schemas/:id for existing schema and return data', async () => {
      const schemaId = 'existing-id';
      const request: UpsertSchemaRequest = { name: 'Updated Schema', schema: { type: 'number' } };
      const expectedResponseData: SavedSchema = {
        id: schemaId, ...request,
        createdAt: new Date(), updatedAt: new Date()
      };
      mockAxiosInstance.put.mockResolvedValueOnce({ data: { success: true, data: expectedResponseData } });

      const result = await client.upsertSchema(request, schemaId);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/schemas/${schemaId}`, request);
      expect(result).toEqual(expectedResponseData);
    });

    it('should handle API error if success is false for upsertSchema', async () => {
       const request: UpsertSchemaRequest = { name: 'New Schema', schema: { type: 'string' } };
       mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: false, error: 'Validation failed' } });

      await expect(client.upsertSchema(request)).rejects.toMatchObject({
          code: 'upsert_error',
          message: 'Validation failed',
      });
    });
  });

  // TODO: Add tests for error interceptor logic if it becomes more complex
  // For example, if it tries to refresh tokens or has other specific behaviors.
});

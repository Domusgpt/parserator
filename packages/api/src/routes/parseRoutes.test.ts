import { parseHandler } from './parseRoutes'; // Adjust path as needed
import { AuthenticatedRequest } from '../middleware/authMiddleware'; // Adjust path as needed
import { Response } from 'express';

// Mock GoogleGenerativeAI
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
  SchemaType: { // Mock SchemaType if it's used directly in tests, though not strictly for these
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
  }
}));

// Mock Firebase Admin (if it were used directly in parseRoutes, not the case here)
// jest.mock('firebase-admin', () => ({
//   initializeApp: jest.fn(),
//   firestore: jest.fn(),
// }));

describe('parseHandler', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      ip: '127.0.0.1', // for rateLimitMiddleware if it were part of this test directly
      isAnonymous: true, // for rateLimitMiddleware if it were part of this test directly
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(), // for other types of responses
    };
    originalNodeEnv = process.env.NODE_ENV;

    // Default mock for successful API calls to avoid breaking valid input tests
    mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: 'mock' } }), // For Architect
        },
      }).mockResolvedValueOnce({ // First call for Architect
        response: {
          text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: 'mock' } }),
        },
      }).mockResolvedValueOnce({ // Second call for Extractor
         response: {
           text: () => JSON.stringify({ data: 'mocked_extracted_data' }),
         },
      });
    process.env.GEMINI_API_KEY = 'test-api-key'; // Ensure API key is set
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv; // Restore original NODE_ENV
  });

  describe('Input Size Limits', () => {
    it('should return 413 if inputData exceeds MAX_INPUT_SIZE_BYTES (1MB)', async () => {
      const ONE_MB = 1 * 1024 * 1024;
      const largeInput = 'a'.repeat(ONE_MB + 1); // Slightly larger than 1MB
      mockReq.body = {
        inputData: largeInput,
        outputSchema: { data: 'string' },
      };

      await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'PAYLOAD_TOO_LARGE',
            message: expect.stringContaining('Input data exceeds the maximum allowed size of 1MB'),
          }),
        })
      );
    });

    it('should return 400 if inputData is not a string', async () => {
      mockReq.body = {
        inputData: 12345, // Not a string
        outputSchema: { data: 'string' },
      };

      await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_INPUT_TYPE',
          message: 'inputData must be a string.',
        },
      });
    });

    it('should proceed if inputData is within size limits and is a string', async () => {
      mockReq.body = {
        inputData: 'This is valid input data.',
        outputSchema: { data: 'string' },
      };
      // We expect it to proceed past the initial checks.
      // Since Gemini calls are mocked, we just check that it doesn't return an early error status.
      // It will eventually try to call Gemini, which is fine for this test.
      // The actual success (200) is tested elsewhere or would require more elaborate mocking here.

      await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

      // Check that it did not return 413 or 400 due to size/type checks
      expect(mockRes.status).not.toHaveBeenCalledWith(413);
      expect(mockRes.status).not.toHaveBeenCalledWith(400);
      // It will call status for other reasons (e.g. 200 or 500 if mocks are not perfect)
      // For this specific test, we are interested in it *not* being an input validation error.
      // A more robust check would be to see if it attempts to call the Gemini mock,
      // but for simplicity, we ensure no early exit due to size.
      expect(mockGetGenerativeModel).toHaveBeenCalled(); // Confirms it passed initial validations
    });
  });

  describe('Malformed JSON Error Handling', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'development'; // For checking 'details' field
    });

    it('should return 422 if Architect response is malformed JSON', async () => {
        mockReq.body = {
          inputData: 'Valid input',
          outputSchema: { data: 'string' },
        };

        // Override default mock for this specific test
        mockGetGenerativeModel.mockImplementation(() => ({
            generateContent: jest.fn().mockResolvedValueOnce({ // Architect call
              response: {
                text: () => 'this is not json', // Malformed JSON
              },
            }),
          }));

        await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'ARCHITECT_PARSE_FAILED',
              message: 'Failed to parse response from Architect service. The input data may have caused an issue.',
              details: expect.objectContaining({
                error: expect.any(String), // JSON.parse error message
                rawResponse: 'this is not json',
              }),
            }),
          })
        );
      });

      it('should return 422 if Architect response is JSON but not a valid SearchPlan structure', async () => {
        mockReq.body = {
          inputData: 'Valid input',
          outputSchema: { data: 'string' },
        };

        mockGetGenerativeModel.mockImplementation(() => ({
            generateContent: jest.fn().mockResolvedValueOnce({ // Architect call
              response: {
                text: () => JSON.stringify({ someOtherField: "instead of searchPlan" }),
              },
            }),
          }));

        await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'ARCHITECT_INVALID_RESPONSE_STRUCTURE',
              message: 'Failed to parse valid SearchPlan structure from Architect service.',
              details: expect.objectContaining({
                rawResponse: JSON.stringify({ someOtherField: "instead of searchPlan" }),
              }),
            }),
          })
        );
      });

      it('should return 422 if Extractor response is malformed JSON', async () => {
        mockReq.body = {
          inputData: 'Valid input',
          outputSchema: { data: 'string' },
        };

        // Mock Architect to succeed, Extractor to fail
        mockGetGenerativeModel.mockImplementation(() => ({
            generateContent: jest.fn()
              .mockResolvedValueOnce({ // Architect call - success
                response: {
                  text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: 'mock' } }),
                },
              })
              .mockResolvedValueOnce({ // Extractor call - failure
                response: {
                  text: () => 'this is not json either', // Malformed JSON
                },
              }),
          }));

        await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'EXTRACTOR_PARSE_FAILED',
              message: 'Failed to parse response from Extractor service. The input data or search plan may have caused an issue.',
              details: expect.objectContaining({
                error: expect.any(String), // JSON.parse error message
                rawResponse: 'this is not json either',
              }),
            }),
          })
        );
      });

      it('should return 422 if Extractor response is JSON but not a valid object', async () => {
        mockReq.body = {
          inputData: 'Valid input',
          outputSchema: { data: 'string' },
        };

        mockGetGenerativeModel.mockImplementation(() => ({
            generateContent: jest.fn()
              .mockResolvedValueOnce({ // Architect call - success
                response: {
                  text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: 'mock' } }),
                },
              })
              .mockResolvedValueOnce({ // Extractor call - failure (not an object)
                response: {
                  text: () => JSON.stringify("just a string, not an object"),
                },
              }),
          }));

        await parseHandler(mockReq as AuthenticatedRequest, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(422);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'EXTRACTOR_INVALID_RESPONSE_STRUCTURE',
              message: 'Extractor service returned a non-object response.',
              details: expect.objectContaining({
                rawResponse: JSON.stringify("just a string, not an object"),
              }),
            }),
          })
        );
      });
  });

  // TODO: Add tests for successful parsing, missing inputData/outputSchema, missing API key
  // These would require more refined mocking of the Gemini calls for success cases.
});

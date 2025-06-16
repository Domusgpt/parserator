// @ts-nocheck // To simplify mocking

import * as admin from 'firebase-admin';
// We need to import the main 'app' from index.ts AFTER mocks are set up.
let mainAppHandler;
let sanitizeHTMLInternal;
let escapeBackticksInternal;

// Captured prompt for assertion
let capturedArchitectPrompt = '';
let capturedExtractorPrompt = '';

// Mock Firebase Admin SDK (Firestore & Auth)
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    runTransaction: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock_server_timestamp'),
      increment: jest.fn(val => ({ MOCK_INCREMENT: val })),
    },
  };
  mockFirestore.collection.mockReturnThis();
  mockFirestore.doc.mockReturnThis();

  const mockAuth = {
    verifyIdToken: jest.fn(),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    auth: jest.fn(() => mockAuth),
  };
});

// Mock firebase-functions/params
jest.mock('firebase-functions/params', () => ({
  defineSecret: jest.fn((name) => ({ value: () => `mock_secret_${name}` })),
}));

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
  const mockGenerativeModel = {
    generateContent: jest.fn(),
  };
  const mockGoogleGenerativeAI = {
    getGenerativeModel: jest.fn(() => mockGenerativeModel),
  };
  return {
    GoogleGenerativeAI: jest.fn(() => mockGoogleGenerativeAI),
    SchemaType: { // Mock SchemaType if it's used directly in checks (it is)
        OBJECT: 'OBJECT',
        ARRAY: 'ARRAY',
        STRING: 'STRING',
        NUMBER: 'NUMBER',
        BOOLEAN: 'BOOLEAN',
    }
  };
});


// Helper to reset mocks
const resetAllMocks = () => {
  const fs = admin.firestore();
  fs.collection.mockClear();
  fs.doc.mockClear();
  fs.get.mockClear();
  fs.set.mockClear();
  fs.update.mockClear();
  fs.runTransaction.mockClear();
  if (fs.FieldValue.increment.mockClear) fs.FieldValue.increment.mockClear();

  admin.auth().verifyIdToken.mockClear();

  const genAIMock = require('@google/generative-ai');
  genAIMock.GoogleGenerativeAI().getGenerativeModel().generateContent.mockReset();
  capturedArchitectPrompt = '';
  capturedExtractorPrompt = '';
};


describe('Input Validation and Sanitization in index.ts', () => {
  let mockReq;
  let mockRes;
  const db = admin.firestore();
  const auth = admin.auth();
  const { GoogleGenerativeAI } = require('@google/generative-ai'); // Get the mocked version
  const mockGenerateContent = GoogleGenerativeAI().getGenerativeModel().generateContent;


  beforeAll(async () => {
    const indexModule = await import('../index');
    mainAppHandler = indexModule.app;
    // For directly testing utility functions if they were exported:
    // sanitizeHTMLInternal = indexModule.sanitizeHTML;
    // escapeBackticksInternal = indexModule.escapeBackticks;
  });

  beforeEach(() => {
    resetAllMocks();
    mockReq = {
      method: 'POST',
      headers: {},
      body: {},
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('/v1/user/keys API Key Name Sanitization', () => {
    const mockUserIdToken = 'mockUserFirebaseId';
    const endpointUrl = '/v1/user/keys';

    it('should sanitize HTML special characters and backticks in API key name upon creation', async () => {
      mockReq.url = endpointUrl;
      mockReq.headers['authorization'] = `Bearer mockFirebaseToken`;
      const rawName = "<script>alert('XSS')</script> & `name` with backticks";
      // Expected: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt; &amp; &#x60;name&#x60; with backticks
      const expectedSanitizedName = "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt; &amp; &#x60;name&#x60; with backticks";
      mockReq.body = { name: rawName };

      auth.verifyIdToken.mockResolvedValue({ uid: mockUserIdToken });
      db.set.mockResolvedValue({}); // Mock Firestore set operation

      await mainAppHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200); // Or 201 if that's what it returns
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        name: expectedSanitizedName,
      }));

      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        name: expectedSanitizedName,
        userId: mockUserIdToken,
      }));
    });
     it('should use default sanitized name if no name is provided', async () => {
      mockReq.url = endpointUrl;
      mockReq.headers['authorization'] = `Bearer mockFirebaseToken`;
      mockReq.body = {}; // No name provided

      auth.verifyIdToken.mockResolvedValue({ uid: mockUserIdToken });
      db.set.mockResolvedValue({});

      await mainAppHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        name: "Default API Key", // Default name is not sanitized as it's safe
      }));
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        name: "Default API Key",
      }));
    });

    it('should handle empty string name correctly (sanitizes to empty string)', async () => {
      mockReq.url = endpointUrl;
      mockReq.headers['authorization'] = `Bearer mockFirebaseToken`;
      mockReq.body = { name: "" };

      auth.verifyIdToken.mockResolvedValue({ uid: mockUserIdToken });
      db.set.mockResolvedValue({});

      await mainAppHandler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ name: "" }));
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ name: "" }));
    });
  });

  describe('/v1/parse Backtick Escaping in inputData', () => {
    const endpointUrl = '/v1/parse';

    beforeEach(() => {
      mockReq.url = endpointUrl;
      mockReq.body = {
        outputSchema: { field: 'string' },
      };
      // Mock API key validation to pass (anonymous or authed, doesn't matter for this test focus)
      // For anonymous:
      db.runTransaction.mockImplementation(async (updateFn) => { // RPM check
        await updateFn({ get: async () => ({ exists: false }), set: () => {} });
      });
      db.get.mockResolvedValue({ exists: false }); // Daily/Monthly checks

      // Mock Gemini AI responses
      mockGenerateContent
        .mockResolvedValueOnce({ // Architect
          response: { text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: "test" }}) }
        })
        .mockResolvedValueOnce({ // Extractor
          response: { text: () => JSON.stringify({ field: "some value" }) }
        });

      // Capture prompts
      mockGenerateContent.mockImplementation(async (promptContent) => {
        if (!capturedArchitectPrompt) {
          capturedArchitectPrompt = promptContent;
          return { response: { text: () => JSON.stringify({ searchPlan: { steps: [], confidence: 0.9, strategy: "test" }}) } };
        } else {
          capturedExtractorPrompt = promptContent;
          return { response: { text: () => JSON.stringify({ field: "some value" }) } };
        }
      });
    });

    it('should successfully process inputData with backticks and escape them in prompts', async () => {
      const inputWithBackticks = "This is `data` with a single backtick and ``double`` backticks and a final one `.";
      const expectedEscapedInputForPrompt = "This is \\`data\\` with a single backtick and \\`\\`double\\`\\` backticks and a final one \\`.";
      mockReq.body.inputData = inputWithBackticks;

      await mainAppHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        parsedData: { field: "some value" },
      }));

      // Check architect prompt
      expect(capturedArchitectPrompt).toContain(`SAMPLE DATA:\n${expectedEscapedInputForPrompt.substring(0,1000)}`);
      // Check extractor prompt
      expect(capturedExtractorPrompt).toContain(`FULL INPUT DATA:\n${expectedEscapedInputForPrompt}`);
    });

    it('should successfully process inputData without backticks', async () => {
      const normalInput = "This is normal data without any backticks.";
      mockReq.body.inputData = normalInput;

      await mainAppHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        parsedData: { field: "some value" },
      }));
      expect(capturedArchitectPrompt).toContain(`SAMPLE DATA:\n${normalInput.substring(0,1000)}`);
      expect(capturedExtractorPrompt).toContain(`FULL INPUT DATA:\n${normalInput}`);
    });

     it('should handle empty inputData by passing empty string to prompts', async () => {
      mockReq.body.inputData = "";

      await mainAppHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(capturedArchitectPrompt).toContain(`SAMPLE DATA:\n`);
      expect(capturedExtractorPrompt).toContain(`FULL INPUT DATA:\n`);
    });
  });
});

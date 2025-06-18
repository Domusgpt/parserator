// @ts-nocheck // To simplify mocking

import * as admin from 'firebase-admin';
// Import the actual cache instance for potential inspection/clearing if not using jest.resetModules()
// For now, we'll rely on resetting modules or careful test design.

let mainAppHandler;
let generateCacheKeyInternal;
let getCachedPlanInternal;
let setCachedPlanInternal;
let deleteCachedPlanInternal;
let architectPlanCacheInternal; // For direct cache manipulation if needed for tests
let MAX_CACHE_SIZE_INTERNAL; // To override for specific tests

// --- Mocks Setup ---
let mockArchitectCallCount = 0;
let mockArchitectFunc = jest.fn();
let mockExtractorFunc = jest.fn();

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }), // Default pass for limits
    set: jest.fn().mockResolvedValue({}),
    update: jest.fn(),
    runTransaction: jest.fn().mockImplementation(async (cb) => { // Default pass for RPM
      await cb({ get: async () => ({ exists: false }), set: () => {} });
    }),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock_server_timestamp'),
      increment: jest.fn(val => ({ MOCK_INCREMENT: val })),
    },
  };
  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    auth: jest.fn(() => ({ verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-uid' }) })),
  };
});

jest.mock('firebase-functions/params', () => ({
  defineSecret: jest.fn((name) => ({ value: () => `mock_secret_${name}` })),
}));

jest.mock('@google/generative-ai', () => {
  const actualGoogleGenerativeAI = jest.requireActual('@google/generative-ai');
  return {
    ...actualGoogleGenerativeAI, // Import other exports like SchemaType
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn((config) => {
        // Differentiate between architect and extractor models based on schema, if needed,
        // or simply use the order of calls / specific mock functions.
        // For these tests, we'll assume the first getGenerativeModel is Architect, second is Extractor
        // if only one generateContent is called per model.
        // A more robust way is to check config or prompt content if the test needs it.
        if (config?.generationConfig?.responseSchema?.properties?.searchPlan) { // Architect model
            return { generateContent: mockArchitectFunc };
        }
        return { generateContent: mockExtractorFunc }; // Extractor model
      }),
    })),
  };
});

// Helper to reset all mocks and module state
const resetTestState = async () => {
  jest.clearAllMocks(); // Clears call counts etc. for jest.fn()
  mockArchitectCallCount = 0; // Reset our custom counter

  // Reset Firestore mocks to default "pass" behavior for rate limits
  const fs = admin.firestore();
  fs.get.mockReset().mockResolvedValue({ exists: false, data: () => ({}) });
  fs.runTransaction.mockReset().mockImplementation(async (cb) => {
    await cb({ get: async () => ({ exists: false }), set: () => {} });
  });
   fs.collection.mockClear().mockReturnThis();
   fs.doc.mockClear().mockReturnThis();
   fs.set.mockClear();


  // Reset Gemini mocks
  mockArchitectFunc.mockReset();
  mockExtractorFunc.mockReset();

  // Reset modules to clear in-memory cache in index.ts
  jest.resetModules();
  const indexModule = await import('../index');
  mainAppHandler = indexModule.app;
  // Re-assign internal functions/variables if needed for direct inspection
  generateCacheKeyInternal = indexModule.generateCacheKey;
  getCachedPlanInternal = indexModule.getCachedPlan;
  setCachedPlanInternal = indexModule.setCachedPlan;
  deleteCachedPlanInternal = indexModule.deleteCachedPlan;
  architectPlanCacheInternal = indexModule.architectPlanCache; // Get the actual cache Map
  MAX_CACHE_SIZE_INTERNAL = indexModule.MAX_CACHE_SIZE; // Get the actual max size
};


describe('Architect Plan Caching and Re-architecture in index.ts', () => {
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    await resetTestState(); // Ensure clean state for each test

    mockReq = {
      method: 'POST',
      url: '/v1/parse',
      headers: { 'x-api-key': 'pk_test_validkey' }, // Assume valid key for simplicity
      body: {
        inputData: 'Test input data.',
        // outputSchema will be set per test
      },
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Default Architect & Extractor behavior
    mockArchitectFunc.mockImplementation(async (prompt) => {
      mockArchitectCallCount++;
      return { response: { text: () => JSON.stringify({ searchPlan: { steps: [{ field: "test", instruction: "extract test" }], confidence: 0.9, strategy: "mock" } }) } };
    });
    mockExtractorFunc.mockResolvedValue({ response: { text: () => JSON.stringify({ test: "extracted value" }) } });

    // Default mock for API key validation (if not using anonymous)
    const fs = admin.firestore();
     fs.get.mockImplementation(async (docPath) => {
        if (docPath === `api_keys/pk_test_validkey`) {
          return { exists: true, data: () => ({ userId: 'test-user-id', active: true }) };
        }
        if (docPath === `users/test-user-id`) {
          return { exists: true, data: () => ({ subscription: { tier: 'free' } }) };
        }
        // Default for usage checks (no usage yet)
        return { exists: false, data: () => ({}) };
      });
  });

  it('Cache Hit: should use cached plan on second identical schema request', async () => {
    mockReq.body.outputSchema = { fieldA: "string" };

    // First call - should call Architect
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    let responseBody1 = mockRes.json.mock.calls[0][0];
    expect(responseBody1.metadata.cacheInfo.retrievedFromCache).toBe(false);

    // Second call with same schema
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1); // Architect not called again
    expect(mockRes.status).toHaveBeenCalledWith(200);
    let responseBody2 = mockRes.json.mock.calls[1][0];
    expect(responseBody2.metadata.cacheInfo.retrievedFromCache).toBe(true);
    expect(responseBody2.parsedData).toEqual({ test: "extracted value" });
  });

  it('Cache Miss: should call Architect if schema is new', async () => {
    mockReq.body.outputSchema = { fieldB: "number" };
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json.mock.calls[0][0].metadata.cacheInfo.retrievedFromCache).toBe(false);
  });

  it('forceRefreshArchitect: true should call Architect even if plan is cached', async () => {
    mockReq.body.outputSchema = { fieldC: "boolean" };

    // First call to populate cache
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1);
    expect(mockRes.json.mock.calls[0][0].metadata.cacheInfo.retrievedFromCache).toBe(false);

    // Second call with forceRefreshArchitect: true
    mockReq.body.forceRefreshArchitect = true;
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(2); // Architect called again
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json.mock.calls[1][0].metadata.cacheInfo.retrievedFromCache).toBe(false);
  });

  it('Cache Eviction (LRU): should evict oldest plan when MAX_CACHE_SIZE is reached', async () => {
    // Temporarily override MAX_CACHE_SIZE for this test.
    // This requires index.ts to export MAX_CACHE_SIZE or have a setter,
    // or we re-require the module with a different env var if it's based on that.
    // For this example, we assume architectPlanCacheInternal is the actual Map from index.ts.
    // We'll clear it and then add MAX_CACHE_SIZE items.

    architectPlanCacheInternal.clear(); // Start with an empty cache for this specific test
    const localMaxCacheSize = 2; // Test with a small size

    // Helper to simulate a call and assert architect involvement
    const callAndCheck = async (schemaName, expectedArchitectCalls) => {
      mockReq.body.outputSchema = { name: schemaName };
      mockReq.body.forceRefreshArchitect = false; // ensure not forced
      await mainAppHandler(mockReq, mockRes);
      expect(mockArchitectCallCount).toBe(expectedArchitectCalls);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    };

    // Fill the cache up to localMaxCacheSize
    await callAndCheck("SchemaA", 1); // Call 1 (A) -> Architect called
    expect(architectPlanCacheInternal.size).toBe(1);
    await callAndCheck("SchemaB", 2); // Call 2 (B) -> Architect called
    expect(architectPlanCacheInternal.size).toBe(localMaxCacheSize);

    // This call should evict SchemaA (oldest)
    await callAndCheck("SchemaC", 3); // Call 3 (C) -> Architect called
    expect(architectPlanCacheInternal.size).toBe(localMaxCacheSize);
    // SchemaA should be evicted, B and C remain. Check by trying to get A.
    const keyA = generateCacheKeyInternal({ name: "SchemaA" });
    expect(architectPlanCacheInternal.has(keyA)).toBe(false);
    const keyB = generateCacheKeyInternal({ name: "SchemaB" });
    expect(architectPlanCacheInternal.has(keyB)).toBe(true);
    const keyC = generateCacheKeyInternal({ name: "SchemaC" });
    expect(architectPlanCacheInternal.has(keyC)).toBe(true);


    // Call SchemaA again, should be a miss and call Architect
    await callAndCheck("SchemaA", 4); // Call 4 (A) -> Architect called
    expect(architectPlanCacheInternal.size).toBe(localMaxCacheSize);
    // Now B should be evicted
    expect(architectPlanCacheInternal.has(keyA)).toBe(true);
    expect(architectPlanCacheInternal.has(keyB)).toBe(false);
    expect(architectPlanCacheInternal.has(keyC)).toBe(true);
  });


  it('Extractor Failure Invalidation: should invalidate cache if Extractor fails heuristic', async () => {
    const schemaE = { product: "string", price: "number", inStock: "boolean" };
    mockReq.body.outputSchema = schemaE;

    // 1. First call: Architect runs, Extractor returns good data
    mockArchitectFunc.mockImplementationOnce(async () => {
      mockArchitectCallCount++;
      return { response: { text: () => JSON.stringify({ searchPlan: { steps: [{f:"product"},{f:"price"},{f:"inStock"}], confidence: 0.9, strategy: "good_plan_E" } }) } };
    });
    mockExtractorFunc.mockImplementationOnce(async () => ({ response: { text: () => JSON.stringify({ product: "Laptop", price: 1200, inStock: true }) } }));

    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1);
    let responseBody1 = mockRes.json.mock.calls[0][0];
    expect(responseBody1.metadata.cacheInfo.retrievedFromCache).toBe(false);
    expect(responseBody1.metadata.cacheInfo.invalidatedByExtractor).toBe(false);

    // 2. Second call (SchemaE): Cache hit for PlanE. Extractor returns poor data (missing fields)
    mockExtractorFunc.mockReset(); // Reset previous mock
    mockExtractorFunc.mockImplementationOnce(async () => ({ response: { text: () => JSON.stringify({ product: "Laptop", price: null, inStock: null }) } })); // price & inStock are null

    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1); // Architect NOT called (cache hit)
    let responseBody2 = mockRes.json.mock.calls[1][0];
    expect(responseBody2.metadata.cacheInfo.retrievedFromCache).toBe(true);
    expect(responseBody2.metadata.cacheInfo.invalidatedByExtractor).toBe(true); // Cache was invalidated

    // 3. Third call (SchemaE): Cache miss (due to invalidation), Architect runs again
    mockArchitectFunc.mockImplementationOnce(async () => { // Resetting mock for this specific call
      mockArchitectCallCount++;
      return { response: { text: () => JSON.stringify({ searchPlan: { steps: [{f:"product"},{f:"price"},{f:"inStock"}], confidence: 0.9, strategy: "new_plan_E" } }) } };
    });
    mockExtractorFunc.mockReset();
    mockExtractorFunc.mockImplementationOnce(async () => ({ response: { text: () => JSON.stringify({ product: "Laptop", price: 1200, inStock: true }) } })); // Good data again

    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(2); // Architect called again
    let responseBody3 = mockRes.json.mock.calls[2][0];
    expect(responseBody3.metadata.cacheInfo.retrievedFromCache).toBe(false);
    expect(responseBody3.metadata.cacheInfo.invalidatedByExtractor).toBe(false);
  });

  it('Schema Change: should lead to cache miss and call Architect', async () => {
    mockReq.body.outputSchema = { schemaF: "string" };
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(1);
    expect(mockRes.json.mock.calls[0][0].metadata.cacheInfo.retrievedFromCache).toBe(false);

    mockReq.body.outputSchema = { schemaG: "different_string" }; // Different schema
    await mainAppHandler(mockReq, mockRes);
    expect(mockArchitectCallCount).toBe(2); // Architect called again
    expect(mockRes.json.mock.calls[1][0].metadata.cacheInfo.retrievedFromCache).toBe(false);
  });
});

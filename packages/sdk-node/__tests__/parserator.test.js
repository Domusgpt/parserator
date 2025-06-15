/**
 * REAL Parserator Node SDK Tests - NO MOCKS
 * Tests against actual API to verify functionality
 */
const { Parserator } = require('../dist/index');

describe('Parserator SDK - REAL API TESTS', () => {
  let client;

  beforeAll(() => {
    client = new Parserator({
      baseURL: 'https://app-5108296280.us-central1.run.app'
    });
  });

  describe('API Health', () => {
    test('should connect to real API', async () => {
      const health = await client.healthCheck();
      
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.message).toContain('Parserator API');
    }, 30000);
  });

  describe('Real Data Parsing', () => {
    test('should parse contact information', async () => {
      const result = await client.parse({
        inputData: 'Sarah Wilson - Product Manager\nEmail: sarah@company.com\nPhone: (555) 123-4567',
        outputSchema: {
          name: 'string',
          role: 'string',
          email: 'string',
          phone: 'string'
        }
      });

      expect(result.success).toBe(true);
      expect(result.parsedData.name).toBe('Sarah Wilson');
      expect(result.parsedData.role).toBe('Product Manager');
      expect(result.parsedData.email).toBe('sarah@company.com');
      expect(result.parsedData.phone).toBe('(555) 123-4567');
      expect(result.metadata.features).toContain('structured-outputs');
    }, 30000);

    test('should parse invoice data', async () => {
      const result = await client.parse({
        inputData: `
          Invoice #INV-001
          Date: 2024-06-15
          Customer: ABC Corp
          Amount: $1,250.00
          Status: Paid
        `,
        outputSchema: {
          invoice_number: 'string',
          date: 'string',
          customer: 'string',
          amount: 'string',
          status: 'string'
        }
      });

      expect(result.success).toBe(true);
      expect(result.parsedData.invoice_number).toBe('INV-001');
      expect(result.parsedData.customer).toBe('ABC Corp');
      expect(result.parsedData.status).toBe('Paid');
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
    }, 30000);

    test('should handle complex nested data', async () => {
      const result = await client.parse({
        inputData: `
          Product: Laptop Pro
          Price: $2,499.99
          Specs: 16GB RAM, 512GB SSD, Intel i7
          In Stock: Yes
          Categories: Electronics, Computers, Business
        `,
        outputSchema: {
          product: 'string',
          price: 'number',
          specs: 'string',
          in_stock: 'boolean',
          categories: 'array'
        }
      });

      expect(result.success).toBe(true);
      expect(result.parsedData.product).toBe('Laptop Pro');
      expect(result.parsedData.price).toBe(2499.99);
      expect(result.parsedData.in_stock).toBe(true);
      expect(Array.isArray(result.parsedData.categories)).toBe(true);
      expect(result.parsedData.categories).toContain('Electronics');
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle malformed input gracefully', async () => {
      const result = await client.parse({
        inputData: '@@#$%^&*()_+',
        outputSchema: {
          name: 'string',
          email: 'string'
        }
      });

      // Should either succeed with best effort or fail gracefully
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
      }
    }, 30000);
  });

  describe('Performance', () => {
    test('should complete parsing within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await client.parse({
        inputData: 'Quick test - John Doe\nEmail: john@test.com',
        outputSchema: {
          name: 'string',
          email: 'string'
        }
      });
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(result.metadata.processingTimeMs).toBeLessThan(8000);
    }, 30000);
  });
});
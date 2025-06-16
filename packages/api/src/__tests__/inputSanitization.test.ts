/**
 * Input Sanitization Tests for Parserator API
 * Tests XSS protection and backtick escaping
 */

import { 
  sanitizeApiKeyName, 
  escapeBackticks, 
  sanitizeParseInput, 
  validateOutputSchema 
} from '../utils/inputSanitizer';

describe('Input Sanitization', () => {
  describe('sanitizeApiKeyName', () => {
    it('should encode HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeApiKeyName(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should encode backticks', () => {
      const input = 'API Key `with backticks`';
      const result = sanitizeApiKeyName(input);
      expect(result).toBe('API Key &#x60;with backticks&#x60;');
    });

    it('should handle ampersands correctly', () => {
      const input = 'Tom & Jerry API Key';
      const result = sanitizeApiKeyName(input);
      expect(result).toBe('Tom &amp; Jerry API Key');
    });

    it('should limit length to 100 characters', () => {
      const input = 'a'.repeat(150);
      const result = sanitizeApiKeyName(input);
      expect(result).toHaveLength(100);
    });

    it('should handle empty/invalid inputs', () => {
      expect(sanitizeApiKeyName('')).toBe('Unnamed API Key');
      expect(sanitizeApiKeyName(null as any)).toBe('Unnamed API Key');
      expect(sanitizeApiKeyName(undefined as any)).toBe('Unnamed API Key');
      expect(sanitizeApiKeyName(123 as any)).toBe('Unnamed API Key');
    });
  });

  describe('escapeBackticks', () => {
    it('should escape backticks to prevent template literal injection', () => {
      const input = 'test`${malicious code}`more text';
      const result = escapeBackticks(input);
      expect(result).toBe('test\\`${malicious code}\\`more text');
    });

    it('should handle multiple backticks', () => {
      const input = '`one` `two` `three`';
      const result = escapeBackticks(input);
      expect(result).toBe('\\`one\\` \\`two\\` \\`three\\`');
    });

    it('should handle empty/invalid inputs', () => {
      expect(escapeBackticks('')).toBe('');
      expect(escapeBackticks(null as any)).toBe('');
      expect(escapeBackticks(undefined as any)).toBe('');
    });
  });

  describe('sanitizeParseInput', () => {
    it('should sanitize valid input', () => {
      const input = 'John Smith `CEO` at Company';
      const result = sanitizeParseInput(input);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('John Smith \\`CEO\\` at Company');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty input', () => {
      const result = sanitizeParseInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input data is required');
    });

    it('should reject non-string input', () => {
      const result = sanitizeParseInput(123 as any);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input data must be a string');
    });

    it('should reject input exceeding size limit', () => {
      const largeInput = 'a'.repeat(1024 * 1024 + 1); // 1MB + 1 char
      const result = sanitizeParseInput(largeInput);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Input too large');
    });

    it('should accept input at size limit', () => {
      const maxSizeInput = 'a'.repeat(1024 * 1024); // Exactly 1MB
      const result = sanitizeParseInput(maxSizeInput);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateOutputSchema', () => {
    it('should accept valid schema', () => {
      const schema = {
        name: 'string',
        age: 'number',
        active: 'boolean',
        tags: 'array'
      };
      
      const result = validateOutputSchema(schema);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-object schema', () => {
      const result = validateOutputSchema('not an object');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Output schema must be an object');
    });

    it('should reject array schema', () => {
      const result = validateOutputSchema(['field1', 'field2']);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Output schema cannot be an array');
    });

    it('should reject empty schema', () => {
      const result = validateOutputSchema({});
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Output schema cannot be empty');
    });

    it('should reject schema with too many fields', () => {
      const schema: any = {};
      for (let i = 0; i < 51; i++) {
        schema[`field${i}`] = 'string';
      }
      
      const result = validateOutputSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Output schema cannot have more than 50 fields');
    });

    it('should reject invalid field types', () => {
      const schema = {
        name: 'string',
        invalid: 'invalid_type'
      };
      
      const result = validateOutputSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid schema type');
    });

    it('should reject invalid field names', () => {
      const schema = {
        '': 'string' // Empty field name
      };
      
      const result = validateOutputSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Schema field names must be non-empty strings');
    });

    it('should reject field names that are too long', () => {
      const longFieldName = 'a'.repeat(101);
      const schema = {
        [longFieldName]: 'string'
      };
      
      const result = validateOutputSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Schema field names cannot exceed 100 characters');
    });
  });
});
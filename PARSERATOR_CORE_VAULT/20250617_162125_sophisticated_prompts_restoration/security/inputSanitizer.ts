/**
 * Input Sanitization Utilities for Parserator API
 * Prevents XSS and malformed prompts
 */

/**
 * Sanitizes API key names to prevent XSS in responses
 */
export function sanitizeApiKeyName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Unnamed API Key';
  }
  
  // Encode HTML special characters and backticks
  return name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .substring(0, 100); // Limit length
}

/**
 * Escapes backticks in input data to prevent prompt injection
 */
export function escapeBackticks(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Escape backticks to prevent template literal injection
  return input.replace(/`/g, '\\`');
}

/**
 * Validates and sanitizes parse input data
 */
export function sanitizeParseInput(inputData: string): { 
  sanitized: string; 
  isValid: boolean; 
  error?: string; 
} {
  if (!inputData) {
    return {
      sanitized: '',
      isValid: false,
      error: 'Input data is required'
    };
  }
  
  if (typeof inputData !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'Input data must be a string'
    };
  }
  
  // Check size limit (1MB)
  const maxSize = 1024 * 1024; // 1MB
  if (inputData.length > maxSize) {
    return {
      sanitized: '',
      isValid: false,
      error: `Input too large. Maximum size is ${maxSize} characters`
    };
  }
  
  // Escape backticks to prevent prompt injection
  const sanitized = escapeBackticks(inputData);
  
  return {
    sanitized,
    isValid: true
  };
}

/**
 * Validates output schema format
 */
export function validateOutputSchema(schema: any): { 
  isValid: boolean; 
  error?: string; 
} {
  if (!schema || typeof schema !== 'object') {
    return {
      isValid: false,
      error: 'Output schema must be an object'
    };
  }
  
  if (Array.isArray(schema)) {
    return {
      isValid: false,
      error: 'Output schema cannot be an array'
    };
  }
  
  const keys = Object.keys(schema);
  if (keys.length === 0) {
    return {
      isValid: false,
      error: 'Output schema cannot be empty'
    };
  }
  
  if (keys.length > 50) {
    return {
      isValid: false,
      error: 'Output schema cannot have more than 50 fields'
    };
  }
  
  // Validate field names and types
  for (const [key, value] of Object.entries(schema)) {
    if (!key || typeof key !== 'string') {
      return {
        isValid: false,
        error: 'Schema field names must be non-empty strings'
      };
    }
    
    if (key.length > 100) {
      return {
        isValid: false,
        error: 'Schema field names cannot exceed 100 characters'
      };
    }
    
    const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
    if (typeof value === 'string' && !validTypes.includes(value.toLowerCase())) {
      return {
        isValid: false,
        error: `Invalid schema type: ${value}. Valid types are: ${validTypes.join(', ')}`
      };
    }
  }
  
  return { isValid: true };
}
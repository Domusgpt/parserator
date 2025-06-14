/**
 * Represents a generic schema object.
 * Schemas can have arbitrary structure, so this is a flexible type.
 */
export interface SchemaObject {
  [key: string]: any;
}

/**
 * Request payload for parsing text.
 */
export interface ParseRequest {
  text: string;
  schema: SchemaObject; // User-defined schema
  schemaId?: string; // Optional: ID of a pre-saved schema
  model?: string; // Optional: Specify a model to use
}

/**
 * Response payload from a parsing operation.
 */
export interface ParseResponse {
  success: boolean;
  result?: Record<string, any>; // The parsed data
  error?: string; // Error message if parsing failed
  usage?: { // Optional: Information about token usage or credits
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Represents a saved schema.
 */
export interface SavedSchema {
  id: string;
  name: string;
  description?: string;
  schema: SchemaObject;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // If schemas are user-specific
}

/**
 * Represents a user object.
 */
export interface User {
  id: string;
  email: string;
  apiKey?: string; // For API users
  createdAt: Date;
  // Add other user-related fields as necessary
}

/**
 * Generic API response structure for non-parsing endpoints (e.g., schema management).
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // Optional: General message
}

/**
 * Request payload for creating or updating a schema.
 */
export interface UpsertSchemaRequest {
  name: string;
  description?: string;
  schema: SchemaObject;
}

// Example of a more specific error structure if needed
export interface ApiError {
  code: string; // e.g., 'validation_error', 'not_found'
  message: string;
  details?: Record<string, any>;
}

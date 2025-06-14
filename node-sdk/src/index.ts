import { ParseratorApiClient, ParseRequest, ParseResponse, SavedSchema, UpsertSchemaRequest, ApiError } from '@parserator/core-api-client';
import { SchemaObject, User } from '@parserator/types'; // Re-exporting for convenience
import 'dotenv/config'; // Automatically load .env

/**
 * Configuration options for the Parserator Node SDK.
 */
export interface ParseratorNodeSDKConfig {
  apiKey?: string; // API key, can also be set via PARSERATOR_API_KEY env variable
  baseURL?: string; // Base URL for the Parserator API
}

/**
 * Parserator Node SDK Client.
 * Provides a convenient interface for interacting with the Parserator API from Node.js environments.
 */
export class ParseratorNodeSDK {
  private apiClient: ParseratorApiClient;

  /**
   * Creates an instance of the ParseratorNodeSDK.
   * @param config - Configuration options for the SDK.
   *                 API key can be provided here or via the PARSERATOR_API_KEY environment variable.
   *                 baseURL can be provided here or defaults to the standard Parserator API URL.
   */
  constructor(config: ParseratorNodeSDKConfig = {}) {
    const apiKey = config.apiKey || process.env.PARSERATOR_API_KEY;
    if (!apiKey) {
      console.warn('Parserator API Key not provided. Some operations may fail. Set PARSERATOR_API_KEY environment variable or provide in config.');
    }
    this.apiClient = new ParseratorApiClient(config.baseURL, apiKey);
  }

  /**
   * Parses the given text according to the provided schema.
   * @param request - The parsing request details (text, schema, schemaId, model).
   * @returns A promise that resolves to the parsing result.
   * @throws {ApiError} If the API request fails.
   */
  public async parse(request: ParseRequest): Promise<ParseResponse> {
    return this.apiClient.parse(request);
  }

  /**
   * Retrieves a specific schema by its ID.
   * @param schemaId - The ID of the schema to retrieve.
   * @returns A promise that resolves to the schema.
   * @throws {ApiError} If the API request fails.
   */
  public async getSchema(schemaId: string): Promise<SavedSchema> {
    return this.apiClient.getSchema(schemaId);
  }

  /**
   * Creates or updates a schema.
   * @param schemaData - The data for the schema to upsert.
   * @param schemaId - Optional ID for updating an existing schema. If not provided, a new schema is created.
   * @returns A promise that resolves to the saved schema.
   * @throws {ApiError} If the API request fails.
   */
  public async upsertSchema(schemaData: UpsertSchemaRequest, schemaId?: string): Promise<SavedSchema> {
    return this.apiClient.upsertSchema(schemaData, schemaId);
  }

  // Add any Node.js-specific functionalities here if needed.
  // For example, methods that interact with the file system to load schemas or text.
}

// Re-export core types for convenience for SDK users
export type {
  ParseRequest,
  ParseResponse,
  SavedSchema,
  UpsertSchemaRequest,
  ApiError,
  SchemaObject,
  User
};

// Optional: Export a default instance or a factory function
// export const parserator = new ParseratorNodeSDK();

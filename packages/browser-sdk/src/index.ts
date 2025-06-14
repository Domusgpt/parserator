import {
  ParseratorApiClient as CoreApiClient, // Rename to avoid potential naming conflicts if this SDK adds its own class later
  ParseRequest,
  ParseResponse,
  SavedSchema,
  UpsertSchemaRequest,
  ApiError,
  ApiResponse,
  SchemaObject,
  User
} from '@parserator/core-api-client';

/**
 * Parserator Browser SDK Client.
 *
 * This class is currently a direct alias for the CoreApiClient.
 * It is provided to offer a browser-specific entry point for the Parserator API
 * and may be extended with browser-specific features in the future.
 *
 * For detailed API documentation, refer to `@parserator/core-api-client`.
 */
export class ParseratorBrowserClient extends CoreApiClient {
  /**
   * Creates an instance of the ParseratorBrowserClient.
   * @param baseURL - The base URL for the Parserator API.
   *                  Defaults to the standard Parserator API URL.
   * @param apiKey - Optional API key for authenticated requests.
   *                 In browser environments, be cautious about exposing API keys.
   *                 It's often better to have a backend proxy that adds the API key.
   */
  constructor(baseURL?: string, apiKey?: string) {
    if (apiKey) {
      console.warn(
        'ParseratorBrowserClient: API key provided directly in the browser. ' +
        'Ensure this is done securely and consider using a backend proxy for sensitive operations.'
      );
    }
    super(baseURL, apiKey);
  }

  // You can add browser-specific methods here in the future.
  // For example, methods that leverage browser features like localStorage,
  // or specific error handling for browser network conditions.
}

// Re-export the client with a more specific name for this SDK
export { ParseratorBrowserClient as ParseratorApiClient };

// Re-export core types for convenience for SDK users.
// This allows users of `@parserator/browser-sdk` to get all necessary types
// without directly depending on `@parserator/types` or `@parserator/core-api-client` for basic usage.
export type {
  ParseRequest,
  ParseResponse,
  SavedSchema,
  UpsertSchemaRequest,
  ApiError,
  ApiResponse,
  SchemaObject,
  User
};

# @parserator/browser-sdk

This package provides the official Parserator SDK for browser environments. It simplifies interaction with the Parserator API from client-side JavaScript/TypeScript applications.

## Purpose

- Offers a convenient and typed interface for the Parserator API, tailored for browser usage.
- Built on top of `@parserator/core-api-client` and `@parserator/types`.
- Includes warnings for potentially insecure practices in the browser (e.g., direct API key exposure).
- Packaged in multiple module formats (ESM, CJS) for broad compatibility.

## Installation

In a monorepo setup, this package is typically linked locally. If published:

```bash
npm install @parserator/browser-sdk
# or
yarn add @parserator/browser-sdk
# or
pnpm add @parserator/browser-sdk
```
This package re-exports necessary types, so direct dependency on `@parserator/types` or `@parserator/core-api-client` might not be needed for basic usage by the end-user, but they are its core dependencies.

## Usage

Import the `ParseratorApiClient` (which is the `ParseratorBrowserClient` class from this SDK) and use it:

```typescript
import { ParseratorApiClient, ParseRequest, ParseResponse, ApiError } from '@parserator/browser-sdk';

// Initialize the client.
// For browser usage, API key management is critical.
// Option 1: API calls are proxied through your backend (recommended for key security).
//           Initialize without API key if your proxy handles auth.
// const apiClient = new ParseratorApiClient('https://your-backend-proxy.com/parserator-api');

// Option 2: If using client-side key (less secure, use with caution, e.g., for low-privilege keys).
//           The SDK will issue a console warning if an API key is passed directly.
// const apiKey = localStorage.getItem('my_parserator_api_key'); // Example
// const apiClient = new ParseratorApiClient(undefined, apiKey || undefined); // Uses default API base URL

// For this example, let's assume a proxy or keyless public endpoint for some actions:
const apiClient = new ParseratorApiClient();


async function performParse(text: string, schema: object) {
  const request: ParseRequest = { text, schema };
  try {
    const response: ParseResponse = await apiClient.parse(request);
    if (response.success) {
      console.log('Parsed Result:', response.result);
    } else {
      console.error('Parsing failed:', response.error);
    }
  } catch (error) {
    // Errors from core-api-client are re-thrown and should be caught
    const apiError = error as ApiError;
    console.error('API Request Failed:', apiError.code, apiError.message);
    // Update your UI based on the error
  }
}

// Example call:
// performParse("User: John Doe, Email: john@example.com", { user_name: "string", user_email: "email" });
```

## API Client

The SDK exports `ParseratorApiClient` (an alias for its `ParseratorBrowserClient` class), which extends `ParseratorApiClient` from `@parserator/core-api-client`. It therefore has the same methods:

- `parse(request: ParseRequest): Promise<ParseResponse>`
- `getSchema(schemaId: string): Promise<SavedSchema>`
- `upsertSchema(request: UpsertSchemaRequest, schemaId?: string): Promise<SavedSchema>`

Refer to the `@parserator/core-api-client` documentation for more details on these methods.

## API Key Management in Browsers

Directly embedding or exposing API keys in client-side code is generally insecure. Consider these approaches:
1.  **Backend Proxy**: Route API calls through your own backend server, which securely attaches the API key. This is the most secure method.
2.  **Temporary/Scoped Tokens**: If your backend can generate short-lived, permission-scoped tokens for client-side use.
3.  **User-Provided Keys**: If users bring their own API keys, store them securely (e.g., `localStorage` for that user only, not hardcoded). The SDK will warn if an API key is passed to its constructor, reminding of the security implications.

## Related Packages

- [`@parserator/core-api-client`](../core-api-client): The core client that this SDK wraps.
- [`@parserator/types`](../types): Provides the TypeScript definitions used by this SDK.
```

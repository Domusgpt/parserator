# @parserator/core-api-client

This package provides a core TypeScript client for interacting with the Parserator API. It's designed primarily for server-side/Node.js environments but can also be the foundation for browser-specific SDKs.

## Purpose

- Offers a typed, robust, and consistent way to make API calls to the Parserator service.
- Handles common API interaction patterns (request/response, error handling).
- Uses `@parserator/types` for strong typing of request and response objects.
- Built with `axios` for HTTP communication.

## Installation

In a monorepo setup, this package is typically linked locally. If published:

```bash
npm install @parserator/core-api-client @parserator/types
# or
yarn add @parserator/core-api-client @parserator/types
# or
pnpm add @parserator/core-api-client @parserator/types
```
(`@parserator/types` is a peer dependency for type definitions).

## Usage

Instantiate the client and use its methods:

```typescript
import { ParseratorApiClient, ParseRequest, ParseResponse, ApiError } from '@parserator/core-api-client';

const apiClient = new ParseratorApiClient('YOUR_API_BASE_URL', 'YOUR_API_KEY');
// const apiClient = new ParseratorApiClient(undefined, 'YOUR_API_KEY'); // Uses default base URL

async function exampleParse(text: string, schema: object) {
  const request: ParseRequest = { text, schema };
  try {
    const response: ParseResponse = await apiClient.parse(request);
    if (response.success) {
      console.log('Parsed Result:', response.result);
      console.log('Usage:', response.usage);
    } else {
      console.error('Parsing failed:', response.error);
    }
  } catch (error) {
    const apiError = error as ApiError;
    console.error('API Request Failed:', apiError.code, apiError.message, apiError.details);
  }
}

// Example:
// exampleParse("Extract name: John Doe, age: 30", { name: "string", age: "number" });
```

## API Client Methods

The `ParseratorApiClient` class provides methods such as:

- `parse(request: ParseRequest): Promise<ParseResponse>`: Parses text according to a schema.
- `getSchema(schemaId: string): Promise<SavedSchema>`: Retrieves a specific schema.
- `upsertSchema(request: UpsertSchemaRequest, schemaId?: string): Promise<SavedSchema>`: Creates or updates a schema.

Refer to `src/client.ts` for the full class definition and method signatures. The client also includes an error interceptor that attempts to normalize API errors into the `ApiError` structure.

## Error Handling

The client methods are designed to throw `ApiError` (from `@parserator/types`, re-exported by this package) when the API returns an error or network issues occur. Ensure you wrap API calls in `try/catch` blocks.

## Related Packages

- [`@parserator/types`](../types): Provides the TypeScript definitions used by this client.
- [`@parserator/browser-sdk`](../browser-sdk): A browser-specific SDK that wraps this core client.
- [`@parserator/node-sdk`](../../node-sdk): A Node.js specific SDK that wraps this core client.
```

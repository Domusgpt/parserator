# @parserator/types

This package contains common TypeScript definitions for API request/response objects and other shared data structures used across the Parserator ecosystem.

## Purpose

- Provides a single source of truth for API-related types.
- Ensures type consistency between the frontend components, SDKs, and the API itself.
- Improves developer experience with type safety and auto-completion.

## Installation

In a monorepo setup (e.g., using npm/pnpm/yarn workspaces), this package is typically linked locally. If it were published to a private npm registry, you would install it like any other package:

```bash
npm install @parserator/types
# or
yarn add @parserator/types
# or
pnpm add @parserator/types
```

## Usage

Import the types directly into your TypeScript files:

```typescript
import { ParseRequest, ParseResponse, SavedSchema, ApiError } from '@parserator/types';

function handleApiResponse(response: ParseResponse) {
  if (response.success) {
    console.log('Parsed data:', response.result);
  } else {
    console.error('API Error:', response.error);
  }
}

const requestPayload: ParseRequest = {
  text: "User input text...",
  schema: {
    fieldName: "string",
    anotherField: "number"
  }
};
```

## Key Types

- `ParseRequest`: Structure for parsing requests.
- `ParseResponse`: Structure for responses from parsing operations.
- `SavedSchema`: Represents a schema object stored in the system.
- `UpsertSchemaRequest`: For creating or updating schemas.
- `User`: Represents a user.
- `ApiError`: Common error structure from the API.
- `ApiResponse<T>`: Generic wrapper for many API responses.
- `SchemaObject`: A generic type for user-defined schemas.

Refer to `index.ts` for the full list of exported types and their definitions.

## Related Packages

- [`@parserator/core-api-client`](../core-api-client): Uses these types for its API method signatures.
- [`@parserator/browser-sdk`](../browser-sdk): Re-exports types from here and uses them.
- [`@parserator/node-sdk`](../../node-sdk): Re-exports types from here and uses them.
```

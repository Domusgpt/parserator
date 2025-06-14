export { ParseratorApiClient } from './client';

// Re-export key types from @parserator/types for convenience,
// so users of core-api-client don't necessarily need to install @parserator/types separately
// if their needs are simple. However, for extensive type usage,
// directly depending on @parserator/types is recommended.
export type {
  ParseRequest,
  ParseResponse,
  SavedSchema,
  UpsertSchemaRequest,
  SchemaObject,
  ApiError,
  ApiResponse,
  User
} from '@parserator/types';

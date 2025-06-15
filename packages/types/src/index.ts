/**
 * @parserator/types
 * Shared TypeScript definitions for Parserator API
 * Based on production API responses and Jules' architectural patterns
 */

// ===============================
// CORE API TYPES
// ===============================

export interface ParseRequest {
  /** The unstructured text data to parse */
  inputData: string;
  
  /** JSON schema defining the desired output structure */
  outputSchema: Record<string, any>;
  
  /** Optional instructions for parsing context */
  instructions?: string;
  
  /** Optional configuration options */
  options?: ParseOptions;
}

export interface ParseOptions {
  /** Confidence threshold (0-1) for accepting results */
  confidenceThreshold?: number;
  
  /** Maximum processing time in milliseconds */
  timeoutMs?: number;
  
  /** Whether to include detailed metadata in response */
  includeMetadata?: boolean;
}

export interface ParseResponse {
  /** Whether the parsing operation succeeded */
  success: boolean;
  
  /** The structured data extracted from input (when successful) */
  parsedData?: any;
  
  /** Detailed metadata about the parsing operation */
  metadata?: ParseMetadata;
  
  /** Error information (when unsuccessful) */
  error?: ApiError;
  
  /** Smart recovery suggestions when parse fails */
  recovery?: ErrorRecovery;
}

export interface ErrorRecovery {
  /** Intelligent suggestions for fixing the parse failure */
  suggestions: RecoverySuggestion[];
  
  /** Simplified schema that might work better */
  suggestedSchema?: Record<string, any>;
  
  /** Preprocessed input data that might parse better */
  suggestedInput?: string;
  
  /** Whether auto-retry is recommended */
  autoRetryRecommended: boolean;
  
  /** Human-readable explanation of what went wrong */
  explanation: string;
}

export interface RecoverySuggestion {
  /** Type of suggestion */
  type: 'schema_simplification' | 'data_chunking' | 'format_preprocessing' | 'retry_strategy';
  
  /** Human-readable suggestion */
  description: string;
  
  /** Executable action (for auto-recovery) */
  action?: {
    type: string;
    parameters: Record<string, any>;
  };
  
  /** Confidence this will help (0-1) */
  confidence: number;
}

export interface ParseMetadata {
  /** Architect stage planning details */
  architectPlan?: ArchitectPlan;
  
  /** Confidence score (0-1) of the parsing result */
  confidence: number;
  
  /** Number of tokens used in the operation */
  tokensUsed: number;
  
  /** Processing time in milliseconds */
  processingTimeMs: number;
  
  /** Unique identifier for this request */
  requestId: string;
  
  /** ISO timestamp of when processing completed */
  timestamp: string;
  
  /** API version used for processing */
  version: string;
}

export interface ArchitectPlan {
  /** Step-by-step extraction instructions */
  steps: ArchitectStep[];
  
  /** Overall confidence in the plan */
  confidence: number;
  
  /** Strategy used for extraction */
  strategy: string;
}

export interface ArchitectStep {
  /** Field name to extract */
  field: string;
  
  /** Human-readable extraction instruction */
  instruction: string;
  
  /** Regex pattern for extraction (if applicable) */
  pattern?: string;
  
  /** Expected data type for validation */
  validation: string;
}

// ===============================
// ERROR HANDLING
// ===============================

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ===============================
// SCHEMA MANAGEMENT (Future)
// ===============================

export interface SavedSchema {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface UpsertSchemaRequest {
  name: string;
  description?: string;
  schema: Record<string, any>;
}

export interface SchemaResponse {
  success: boolean;
  schema?: SavedSchema;
  error?: ApiError;
}

export interface ListSchemasResponse {
  success: boolean;
  schemas?: SavedSchema[];
  error?: ApiError;
}

// ===============================
// CLIENT CONFIGURATION
// ===============================

export interface ClientConfig {
  /** API base URL */
  baseURL?: string;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Custom headers to include with requests */
  headers?: Record<string, string>;
  
  /** Retry configuration */
  retry?: RetryConfig;
}

export interface RetryConfig {
  /** Number of retry attempts */
  attempts: number;
  
  /** Delay between retries in milliseconds */
  delay: number;
  
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
}

// ===============================
// UTILITIES
// ===============================

export type ApiResponse<T = any> = T & {
  success: boolean;
  error?: ApiError;
};

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: ApiError;
}

// ===============================
// CONSTANTS
// ===============================

export const DEFAULT_BASE_URL = 'https://app-5108296280.us-central1.run.app';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
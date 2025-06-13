import { z } from 'zod';

// Core Parserator API types
export const ParseDataRequestSchema = z.object({
  inputData: z.string().describe("The unstructured data to parse"),
  outputSchema: z.record(z.any()).describe("Desired JSON structure"),
  instructions: z.string().optional().describe("Optional parsing guidance")
});

export const ValidateSchemaRequestSchema = z.object({
  data: z.record(z.any()).describe("Data to validate"),
  schema: z.record(z.any()).describe("Schema to validate against")
});

export const SuggestSchemaRequestSchema = z.object({
  sampleData: z.string().describe("Sample of the data to analyze")
});

export type ParseDataRequest = z.infer<typeof ParseDataRequestSchema>;
export type ValidateSchemaRequest = z.infer<typeof ValidateSchemaRequestSchema>;
export type SuggestSchemaRequest = z.infer<typeof SuggestSchemaRequestSchema>;

// Parserator API response types
export interface ParseResult {
  success: boolean;
  parsedData?: any;
  confidence?: number;
  tokensUsed?: number;
  processingTime?: number;
  requestId?: string;
  error?: string;
  code?: string;
}

export interface ValidationResult {
  success: boolean;
  valid: boolean;
  errors?: string[];
  suggestions?: string[];
}

export interface SchemaResult {
  success: boolean;
  suggestedSchema?: any;
  confidence?: number;
  reasoning?: string;
}

// MCP Server configuration
export interface ServerConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}
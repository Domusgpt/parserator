import { Request, Response } from 'express';
import {
    ParseRequest,
    ParseResponse,
    UpsertSchemaRequest,
    SavedSchema,
    ApiResponse,
    ApiError,
    SchemaObject
} from '@parserator/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for schemas (for placeholder & testing purposes)
interface SchemasDB {
  [id: string]: SavedSchema;
}
const schemasDB: SchemasDB = {};

/**
 * Handles parsing requests.
 * POST /parse
 */
export const parseHandler = async (req: Request, res: Response): Promise<void> => {
  const { text, schema, schemaId, model } = req.body as ParseRequest;

  if (!text || (!schema && !schemaId)) {
    const error: ApiError = { code: 'validation_error', message: 'Missing text or schema/schemaId in request body.' };
    res.status(400).json(error);
    return;
  }

  let actualSchema: SchemaObject | undefined = schema;
  if (schemaId) {
    const foundSchema = schemasDB[schemaId];
    if (foundSchema) {
        actualSchema = foundSchema.schema;
    } else if (!schema) { // schemaId provided but not found, and no inline schema
        const error: ApiError = { code: 'not_found', message: `Schema with id ${schemaId} not found.` };
        res.status(404).json(error);
        return;
    }
  }

  if (!actualSchema) { // Should be caught by first check, but as a safeguard
    const error: ApiError = { code: 'validation_error', message: 'Schema could not be determined.' };
    res.status(400).json(error);
    return;
  }

  // Mock Parsing Logic:
  // This is a very basic stub. A real implementation would use an AI model.
  try {
    const parsedResult: Record<string, any> = {};
    if (actualSchema.properties) { // Example: very simple object schema handling
        for (const key in actualSchema.properties) {
            // Simulate extracting first few words of text for each string field
            if ((actualSchema.properties as any)[key].type === "string") {
                parsedResult[key] = `parsed: ${text.substring(0, 10)} for ${key}`;
            } else {
                parsedResult[key] = `mock_value_for_${(actualSchema.properties as any)[key].type}`;
            }
        }
    } else { // Fallback for non-object schemas or simple schemas
        parsedResult.content = `parsed_content: ${text.substring(0, 20)}`;
    }

    const response: ParseResponse = {
      success: true,
      result: parsedResult,
      usage: {
        prompt_tokens: text.length / 4, // mock usage
        completion_tokens: JSON.stringify(parsedResult).length / 4,
        total_tokens: (text.length + JSON.stringify(parsedResult).length) / 4,
      }
    };
    res.status(200).json(response);

  } catch (error: any) {
    console.error('Error during parsing:', error);
    const errorResponse: ParseResponse = { // Conforms to ParseResponse error part
      success: false,
      error: error.message || 'An unexpected error occurred during parsing.',
      // code: (error as ApiError).code || 'parse_failed' // Optional: if error has a code
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Handles schema creation and updates.
 * POST /schemas
 * PUT /schemas/:id
 */
export const upsertSchemaHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, description, schema: schemaContent } = req.body as UpsertSchemaRequest;
  const schemaId = req.params.schemaId; // For PUT requests

  if (!name || !schemaContent) {
    const error: ApiError = { code: 'validation_error', message: 'Missing name or schema content in request body.' };
    res.status(400).json(error);
    return;
  }
   if (typeof schemaContent !== 'object' || schemaContent === null) {
    const error: ApiError = { code: 'validation_error', message: 'Schema content must be a valid JSON object.' };
    res.status(400).json(error);
    return;
  }


  try {
    const now = new Date();
    let savedSchema: SavedSchema;
    let statusCode = 200;

    if (schemaId) { // Update (PUT)
      if (!schemasDB[schemaId]) {
        const error: ApiError = { code: 'not_found', message: `Schema with id ${schemaId} not found for update.` };
        res.status(404).json(error);
        return;
      }
      savedSchema = {
        ...schemasDB[schemaId],
        name,
        description: description || schemasDB[schemaId].description,
        schema: schemaContent,
        updatedAt: now,
      };
      schemasDB[schemaId] = savedSchema;
      statusCode = 200;
       const response: ApiResponse<SavedSchema> = { success: true, data: savedSchema, message: "Schema updated successfully" };
       res.status(statusCode).json(response);
    } else { // Create (POST)
      const newId = uuidv4();
      savedSchema = {
        id: newId,
        name,
        description: description || '',
        schema: schemaContent,
        createdAt: now,
        updatedAt: now,
        // userId: (req as any).user?.id // If you have user auth
      };
      schemasDB[newId] = savedSchema;
      statusCode = 201;
      const response: ApiResponse<SavedSchema> = { success: true, data: savedSchema, message: "Schema created successfully" };
      res.status(statusCode).json(response);
    }
  } catch (error: any) {
    console.error('Error upserting schema:', error);
    const errorResponse: ApiResponse = { success: false, error: error.message || 'Failed to upsert schema.' };
    res.status(500).json(errorResponse);
  }
};


/**
 * Handles schema retrieval.
 * GET /schemas/:id
 */
export const getSchemaHandler = async (req: Request, res: Response): Promise<void> => {
  const schemaId = req.params.schemaId;
  if (!schemaId) { // Should be caught by routing, but good practice
    const error: ApiError = { code: 'validation_error', message: 'Schema ID is required.' };
    res.status(400).json(error);
    return;
  }

  try {
    const foundSchema = schemasDB[schemaId];
    if (foundSchema) {
      const response: ApiResponse<SavedSchema> = { success: true, data: foundSchema };
      res.status(200).json(response);
    } else {
      const errorResponse: ApiResponse = { success: false, error: `Schema with ID ${schemaId} not found.`, message: `Schema with ID ${schemaId} not found.` };
      res.status(404).json(errorResponse);
    }
  } catch (error: any) {
    console.error('Error retrieving schema:', error);
    const errorResponse: ApiResponse = { success: false, error: error.message || 'Failed to retrieve schema.' };
    res.status(500).json(errorResponse);
  }
};

/**
 * Handles listing schemas - basic implementation
 * GET /schemas
 */
export const listSchemasHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const allSchemas = Object.values(schemasDB);
        const response: ApiResponse<SavedSchema[]> = { success: true, data: allSchemas };
        res.status(200).json(response);
    } catch (error: any) {
        console.error('Error listing schemas:', error);
        const errorResponse: ApiResponse = { success: false, error: error.message || 'Failed to list schemas.'};
        res.status(500).json(errorResponse);
    }
};

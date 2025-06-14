import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ParseRequest,
  ParseResponse,
  SavedSchema,
  UpsertSchemaRequest,
  ApiError,
  ApiResponse // Using ApiResponse for generic schema responses
} from '@parserator/types';

const DEFAULT_BASE_URL = 'https://app-5108296280.us-central1.run.app/v1';

export class ParseratorApiClient {
  private axiosInstance: AxiosInstance;
  private apiKey?: string;

  constructor(baseURL: string = DEFAULT_BASE_URL, apiKey?: string) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    });

    this.axiosInstance.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const data = error.response.data as any;
          const apiError: ApiError = {
            code: data?.code || error.response.status.toString(),
            message: data?.message || data?.error || error.message,
            details: data?.details,
          };
          return Promise.reject(apiError);
        } else if (error.request) {
          // The request was made but no response was received
          const apiError: ApiError = {
            code: 'network_error',
            message: 'No response received from server. Check network connection.',
          };
          return Promise.reject(apiError);
        } else {
          // Something happened in setting up the request that triggered an Error
          const apiError: ApiError = {
            code: 'request_setup_error',
            message: error.message,
          };
          return Promise.reject(apiError);
        }
      }
    );
  }

  /**
   * Parses the given text according to the provided schema.
   * @param request - The parsing request details.
   * @returns A promise that resolves to the parsing result.
   */
  public async parse(request: ParseRequest): Promise<ParseResponse> {
    try {
      const response = await this.axiosInstance.post<ParseResponse>('/parse', request);
      // Ensure the response matches ParseResponse structure, even if API is less strict
      if (typeof response.data?.success !== 'boolean') {
        // If the API directly returns the content of "result" on success
        // and errors are actual HTTP errors caught by the interceptor
        return { success: true, result: response.data as any };
      }
      return response.data;
    } catch (error) {
      // More robust check if it's an ApiError-like object (already processed by interceptor)
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error; // Re-throw the ApiError
      }
      // Fallback for other types of errors
      throw { code: 'unknown_error', message: (error as Error).message || 'An unknown error occurred during parsing.' } as ApiError;
    }
  }

  /**
   * Retrieves a specific schema by its ID.
   * @param schemaId - The ID of the schema to retrieve.
   * @returns A promise that resolves to the schema.
   */
  public async getSchema(schemaId: string): Promise<SavedSchema> {
     try {
      // Assuming the API returns ApiResponse<SavedSchema> for this endpoint
      const response = await this.axiosInstance.get<ApiResponse<SavedSchema>>(`/schemas/${schemaId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw { code: 'fetch_error', message: response.data.error || response.data.message || `Failed to fetch schema ${schemaId}` } as ApiError;
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
      }
      throw { code: 'unknown_schema_fetch_error', message: (error as Error).message || `An unknown error occurred while fetching schema ${schemaId}.` } as ApiError;
    }
  }

  /**
   * Creates or updates a schema.
   * If the schema has an ID, it's an update, otherwise it's a create.
   * (This is a common pattern, actual API might have distinct create/update methods)
   * @param schemaData - The data for the schema to upsert.
   * @param schemaId - Optional ID for updating an existing schema.
   * @returns A promise that resolves to the saved schema.
   */
  public async upsertSchema(schemaData: UpsertSchemaRequest, schemaId?: string): Promise<SavedSchema> {
    try {
      const url = schemaId ? `/schemas/${schemaId}` : '/schemas';
      const method = schemaId ? 'put' : 'post';
      // Assuming the API returns ApiResponse<SavedSchema>
      const response = await this.axiosInstance[method]<ApiResponse<SavedSchema>>(url, schemaData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw { code: 'upsert_error', message: response.data.error || response.data.message || 'Failed to upsert schema' } as ApiError;
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
      }
      throw { code: 'unknown_schema_upsert_error', message: (error as Error).message || 'An unknown error occurred while upserting the schema.' } as ApiError;
    }
  }

  // Placeholder for other methods like user management
  // public async getCurrentUser(): Promise<User> { ... }
  // public async listSchemas(): Promise<SavedSchema[]> { ... }
}

import * as vscode from 'vscode';
import {
    ParseratorApiClient,
    ParseRequest as CoreParseRequest, // Renaming to avoid conflict with local ParseOptions if any
    ParseResponse as CoreParseResponse,
    SavedSchema, // Assuming this is what the service might manage or refer to
    UpsertSchemaRequest,
    ApiError
} from '@parserator/core-api-client';
import { SchemaObject } from '@parserator/types'; // For schema definition

// Local type for parse options, can include VSCode specific things like timeout from config
export interface ParseOptions {
    text: string;
    schema: SchemaObject;
    schemaId?: string; // Optional: ID of a pre-saved schema
    model?: string;    // Optional: Specify a model to use
    timeout?: number;  // Optional: VSCode specific timeout override
}

// We can map CoreParseResponse to a more specific ParseResult if needed,
// or use CoreParseResponse directly if it matches the extension's needs.
// For now, let's assume CoreParseResponse is detailed enough.
export type ParseResult = CoreParseResponse;


// Custom error class for the VSCode extension, can wrap ApiError from core-api-client
export class VSCodeParseratorError extends Error {
    public code: string;
    public details?: any;
    public stage?: string; // If your API errors include a 'stage'

    constructor(message: string, code: string, details?: any, stage?: string) {
        super(message);
        this.name = 'VSCodeParseratorError';
        this.code = code;
        this.details = details;
        this.stage = stage; // Assign if relevant
    }

    static fromApiError(apiError: ApiError): VSCodeParseratorError {
        return new VSCodeParseratorError(apiError.message, apiError.code, apiError.details, (apiError as any).stage);
    }
}


export class ParseratorService {
    private apiClient: ParseratorApiClient | null = null;
    private apiKey: string | null = null;
    private baseUrl: string | null = null;
    // timeout is part of client config now

    constructor() {
        this.updateConfiguration();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('parserator.apiKey') || e.affectsConfiguration('parserator.baseUrl')) {
                this.updateConfiguration();
            }
        });
    }

    updateConfiguration() {
        const vscodeConfig = vscode.workspace.getConfiguration('parserator');
        const apiKey = vscodeConfig.get('apiKey') as string | undefined;
        const baseUrl = vscodeConfig.get('baseUrl') as string | undefined; // core-api-client has a default

        if (apiKey && (apiKey !== this.apiKey || baseUrl !== this.baseUrl)) {
            this.apiKey = apiKey;
            this.baseUrl = baseUrl || null; // Pass null to use SDK default
            try {
                this.apiClient = new ParseratorApiClient(this.baseUrl || undefined, this.apiKey);
                console.log('ParseratorService: ApiClient reconfigured.');
            } catch (error) {
                this.apiClient = null;
                console.error('ParseratorService: Failed to create ApiClient', error);
                vscode.window.showErrorMessage('Failed to configure Parserator API client. Check settings.');
            }
        } else if (!apiKey) {
            this.apiClient = null;
            this.apiKey = null;
            this.baseUrl = null;
        }
    }

    private ensureClient(): ParseratorApiClient {
        if (!this.apiClient) {
            // Attempt to reconfigure if the client is missing (e.g. API key was set after startup)
            this.updateConfiguration();
            if (!this.apiClient) {
                 throw new VSCodeParseratorError(
                    'Parserator API client is not configured. Please set your API key in settings.',
                    'NOT_CONFIGURED'
                );
            }
        }
        return this.apiClient;
    }

    async parse(options: ParseOptions): Promise<ParseResult> {
        const client = this.ensureClient();
        this.validateParseOptions(options); // Keep local validation for quick feedback

        const request: CoreParseRequest = {
            text: options.text,
            schema: options.schema,
            schemaId: options.schemaId,
            model: options.model,
        };

        // Note: The core-api-client handles its own timeout based on its constructor.
        // If a per-request timeout is needed, the core-api-client's methods would need to support an options bag.
        // For now, we assume the client's configured timeout is used.
        // If options.timeout is present, it's currently not overriding the client's default.

        try {
            const response = await client.parse(request);
            // The new client.parse already returns ParseResponse which includes { success, result?, error? }
            // It throws ApiError on failure, which we will catch.
            return response;
        } catch (error) {
            // Check if it looks like an ApiError (duck typing)
            if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
                throw VSCodeParseratorError.fromApiError(error as ApiError);
            }
            // Fallback for unexpected errors
            throw new VSCodeParseratorError(
                (error as Error).message || 'An unexpected error occurred during parsing.',
                'UNEXPECTED_ERROR'
            );
        }
    }

    // Example: Refactoring getSchema (if it were part of the old service)
    async getSchema(schemaId: string): Promise<SavedSchema> {
        const client = this.ensureClient();
        try {
            return await client.getSchema(schemaId);
        } catch (error) {
            throw VSCodeParseratorError.fromApiError(error as ApiError);
        }
    }

    // Example: Refactoring upsertSchema (if it were part of the old service)
    async upsertSchema(schemaData: UpsertSchemaRequest, schemaId?: string): Promise<SavedSchema> {
        const client = this.ensureClient();
        try {
            return await client.upsertSchema(schemaData, schemaId);
        } catch (error) {
            throw VSCodeParseratorError.fromApiError(error as ApiError);
        }
    }

    async testConnection(): Promise<boolean> {
        // Re-check config as API key might have been removed
        const vscodeConfig = vscode.workspace.getConfiguration('parserator');
        const apiKey = vscodeConfig.get('apiKey') as string | undefined;
        if (!apiKey) {
            console.log('ParseratorService: No API key for testConnection.');
            return false;
        }

        // Ensure client is attempted to be created with current config
        const client = this.ensureClient();

        try {
            // The core-api-client's testConnection might be different or non-existent.
            // A common way to test is to make a lightweight request, e.g., fetching user info or schemas.
            // Here, we try getSchema with a dummy ID, expecting an ApiError but not a network error.
            await client.getSchema('__test_connection__');
            // If it doesn't throw or throws an expected "not found" error, connection is fine.
            return true;
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.code && apiError.code !== 'network_error' && apiError.code !== 'request_setup_error') {
                // Any API error other than network/setup means we reached the API
                console.log('ParseratorService: Test connection successful (API responded). Error was:', apiError.message);
                return true;
            }
            console.error('ParseratorService: Test connection failed:', error);
            return false;
        }
    }

    // Local validation methods can be kept as they provide quick feedback in the editor.
	private validateParseOptions(options: ParseOptions): void {
		if (!options.text || typeof options.text !== 'string') {
			throw new VSCodeParseratorError(
				'inputData must be a non-empty string',
				'INVALID_INPUT_DATA'
			);
		}

		if (options.text.trim().length === 0) {
			throw new VSCodeParseratorError(
				'inputData cannot be empty or only whitespace',
				'EMPTY_INPUT_DATA'
			);
		}

		if (options.text.length > 100000) { // Example limit
			throw new VSCodeParseratorError(
				'inputData exceeds maximum length of 100KB',
				'INPUT_TOO_LARGE'
			);
		}

		if (!options.schema || typeof options.schema !== 'object') {
			throw new VSCodeParseratorError(
				'outputSchema must be a non-null object',
				'INVALID_OUTPUT_SCHEMA'
			);
		}

		if (Object.keys(options.schema).length === 0) {
			throw new VSCodeParseratorError(
				'outputSchema cannot be empty',
				'EMPTY_OUTPUT_SCHEMA'
			);
		}
        // Other validations can remain here
	}

    isConfigured(): boolean {
        return this.apiClient !== null;
    }

    getApiKeyPrefix(): string {
        const vscodeConfig = vscode.workspace.getConfiguration('parserator');
        const apiKey = vscodeConfig.get('apiKey') as string | undefined;
        if (!apiKey) { return ''; }
        return apiKey.substring(0, Math.min(apiKey.length, 12)) + '...';
    }
}
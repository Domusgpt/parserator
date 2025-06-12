import * as vscode from 'vscode';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ParseOptions {
	inputData: string;
	outputSchema: Record<string, any>;
	instructions?: string;
	timeout?: number;
}

export interface ParseResult {
	success: true;
	parsedData: Record<string, any>;
	metadata: {
		architectPlan: {
			steps: Array<{
				targetKey: string;
				description: string;
				searchInstruction: string;
				validationType: string;
				isRequired: boolean;
			}>;
			totalSteps: number;
			estimatedComplexity: 'low' | 'medium' | 'high';
			architectConfidence: number;
		};
		confidence: number;
		tokensUsed: number;
		processingTimeMs: number;
		architectTokens: number;
		extractorTokens: number;
		stageBreakdown: {
			architect: {
				timeMs: number;
				tokens: number;
				confidence: number;
			};
			extractor: {
				timeMs: number;
				tokens: number;
				confidence: number;
			};
		};
	};
	billing?: {
		subscriptionTier: string;
		monthlyUsage: number;
		monthlyLimit: number;
		apiKeyName?: string;
	};
}

export interface ParseError {
	success: false;
	error: {
		code: string;
		message: string;
		stage: 'validation' | 'architect' | 'extractor' | 'orchestration';
		details?: Record<string, any>;
	};
}

export interface UsageStats {
	success: true;
	usage: {
		subscriptionTier: string;
		monthlyUsage: number;
		monthlyLimit: number;
		remainingRequests: number;
		usagePercentage: number;
	};
	apiKey: {
		name?: string;
		id: string;
	};
}

export class ParseratorError extends Error {
	constructor(
		message: string,
		public code: string,
		public stage?: string,
		public details?: Record<string, any>
	) {
		super(message);
		this.name = 'ParseratorError';
	}
}

export class ParseratorService {
	private http: AxiosInstance | null = null;
	private config: {
		apiKey: string;
		baseUrl: string;
		timeout: number;
	} | null = null;

	constructor() {
		this.updateConfiguration();
	}

	updateConfiguration() {
		const vscodeConfig = vscode.workspace.getConfiguration('parserator');
		const apiKey = vscodeConfig.get('apiKey') as string;
		const baseUrl = vscodeConfig.get('baseUrl') as string || 'https://api.parserator.com';
		const timeout = vscodeConfig.get('timeout') as number || 30000;

		if (!apiKey) {
			this.http = null;
			this.config = null;
			return;
		}

		this.config = { apiKey, baseUrl, timeout };

		this.http = axios.create({
			baseURL: baseUrl,
			timeout: timeout,
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'User-Agent': 'parserator-vscode-extension/1.0.0'
			}
		});

		// Add response interceptor for error handling
		this.http.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response?.data) {
					const errorData = error.response.data;
					throw new ParseratorError(
						errorData.error?.message || 'Unknown API error',
						errorData.error?.code || 'API_ERROR',
						errorData.error?.stage,
						errorData.error?.details
					);
				}
				throw new ParseratorError(
					error.message || 'Network error',
					'NETWORK_ERROR'
				);
			}
		);
	}

	private ensureConfigured(): void {
		if (!this.http || !this.config) {
			throw new ParseratorError(
				'Parserator not configured. Please set your API key in settings.',
				'NOT_CONFIGURED'
			);
		}
	}

	async parse(options: ParseOptions): Promise<ParseResult> {
		this.ensureConfigured();
		this.validateParseOptions(options);

		const requestConfig: AxiosRequestConfig = {
			timeout: options.timeout || this.config!.timeout
		};

		const requestBody = {
			inputData: options.inputData,
			outputSchema: options.outputSchema,
			instructions: options.instructions
		};

		try {
			const response = await this.http!.post('/v1/parse', requestBody, requestConfig);
			
			if (!response.data.success) {
				throw new ParseratorError(
					response.data.error?.message || 'Parse operation failed',
					response.data.error?.code || 'PARSE_FAILED',
					response.data.error?.stage,
					response.data.error?.details
				);
			}

			return response.data as ParseResult;
		} catch (error) {
			if (error instanceof ParseratorError) {
				throw error;
			}
			throw new ParseratorError(
				'Failed to parse data. Please check your input and try again.',
				'PARSE_REQUEST_FAILED',
				undefined,
				{ originalError: (error as Error).message }
			);
		}
	}

	async getUsage(): Promise<UsageStats> {
		this.ensureConfigured();

		try {
			const response = await this.http!.get('/v1/usage');
			return response.data as UsageStats;
		} catch (error) {
			if (error instanceof ParseratorError) {
				throw error;
			}
			throw new ParseratorError(
				'Failed to fetch usage statistics',
				'USAGE_REQUEST_FAILED',
				undefined,
				{ originalError: (error as Error).message }
			);
		}
	}

	async testConnection(): Promise<boolean> {
		this.ensureConfigured();

		try {
			const response = await this.http!.get('/health');
			return response.status === 200 && response.data.status === 'healthy';
		} catch (error) {
			return false;
		}
	}

	async getApiInfo(): Promise<any> {
		this.ensureConfigured();

		try {
			const response = await this.http!.get('/v1/info');
			return response.data;
		} catch (error) {
			if (error instanceof ParseratorError) {
				throw error;
			}
			throw new ParseratorError(
				'Failed to fetch API information',
				'INFO_REQUEST_FAILED',
				undefined,
				{ originalError: (error as Error).message }
			);
		}
	}

	private validateParseOptions(options: ParseOptions): void {
		if (!options.inputData || typeof options.inputData !== 'string') {
			throw new ParseratorError(
				'inputData must be a non-empty string',
				'INVALID_INPUT_DATA'
			);
		}

		if (options.inputData.trim().length === 0) {
			throw new ParseratorError(
				'inputData cannot be empty or only whitespace',
				'EMPTY_INPUT_DATA'
			);
		}

		if (options.inputData.length > 100000) {
			throw new ParseratorError(
				'inputData exceeds maximum length of 100KB',
				'INPUT_TOO_LARGE'
			);
		}

		if (!options.outputSchema || typeof options.outputSchema !== 'object') {
			throw new ParseratorError(
				'outputSchema must be a non-null object',
				'INVALID_OUTPUT_SCHEMA'
			);
		}

		if (Object.keys(options.outputSchema).length === 0) {
			throw new ParseratorError(
				'outputSchema cannot be empty',
				'EMPTY_OUTPUT_SCHEMA'
			);
		}

		if (Object.keys(options.outputSchema).length > 50) {
			throw new ParseratorError(
				'outputSchema exceeds maximum of 50 fields',
				'SCHEMA_TOO_LARGE'
			);
		}

		if (options.instructions && typeof options.instructions !== 'string') {
			throw new ParseratorError(
				'instructions must be a string if provided',
				'INVALID_INSTRUCTIONS'
			);
		}
	}

	isConfigured(): boolean {
		return this.http !== null && this.config !== null;
	}

	getApiKeyPrefix(): string {
		if (!this.config?.apiKey) return '';
		return this.config.apiKey.substring(0, 12) + '...';
	}
}
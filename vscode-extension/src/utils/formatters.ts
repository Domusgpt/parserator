/**
 * Formatting utilities for Parserator extension
 */

import { ParseResult } from '../services/parseratorService';

export class FormatUtils {
	/**
	 * Format confidence score as percentage
	 */
	static formatConfidence(confidence: number): string {
		return `${(confidence * 100).toFixed(1)}%`;
	}

	/**
	 * Format processing time in human-readable format
	 */
	static formatProcessingTime(timeMs: number): string {
		if (timeMs < 1000) {
			return `${timeMs}ms`;
		} else if (timeMs < 60000) {
			return `${(timeMs / 1000).toFixed(1)}s`;
		} else {
			const minutes = Math.floor(timeMs / 60000);
			const seconds = ((timeMs % 60000) / 1000).toFixed(1);
			return `${minutes}m ${seconds}s`;
		}
	}

	/**
	 * Format token count with thousands separator
	 */
	static formatTokens(tokens: number): string {
		return tokens.toLocaleString();
	}

	/**
	 * Format file size in human-readable format
	 */
	static formatFileSize(bytes: number): string {
		const sizes = ['B', 'KB', 'MB', 'GB'];
		if (bytes === 0) { return '0 B'; }
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	}

	/**
	 * Format date for display
	 */
	static formatDate(date: Date): string {
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	}

	/**
	 * Format relative time (e.g., "2 minutes ago")
	 */
	static formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMinutes < 1) {
			return 'just now';
		} else if (diffMinutes < 60) {
			return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else if (diffDays < 7) {
			return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		} else {
			return this.formatDate(date);
		}
	}

	/**
	 * Truncate text to specified length with ellipsis
	 */
	static truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) {
			return text;
		}
		return text.substring(0, maxLength - 3) + '...';
	}

	/**
	 * Format complexity level with emoji
	 */
	static formatComplexity(complexity: 'low' | 'medium' | 'high'): string {
		switch (complexity) {
			case 'low':
				return '🟢 Low';
			case 'medium':
				return '🟡 Medium';
			case 'high':
				return '🔴 High';
			default:
				return '⚪ Unknown';
		}
	}

	/**
	 * Format field type with description
	 */
	static formatFieldType(type: string): string {
		const typeDescriptions: Record<string, string> = {
			'string': 'Text data',
			'number': 'Numeric values',
			'boolean': 'True/false values',
			'email': 'Email addresses',
			'phone': 'Phone numbers',
			'date': 'Date values (YYYY-MM-DD)',
			'datetime': 'Date with time',
			'currency': 'Monetary amounts',
			'url': 'Web addresses',
			'string_array': 'Array of strings'
		};

		return typeDescriptions[type] || type;
	}

	/**
	 * Format API key for display (obscure most characters)
	 */
	static formatApiKey(apiKey: string): string {
		if (!apiKey || apiKey.length < 12) {
			return apiKey;
		}
		return apiKey.substring(0, 12) + '...';
	}

	/**
	 * Format usage percentage with visual indicator
	 */
	static formatUsagePercentage(percentage: number): string {
		let indicator = '🟢';
		if (percentage > 80) {
			indicator = '🔴';
		} else if (percentage > 60) {
			indicator = '🟡';
		}
		return `${indicator} ${percentage.toFixed(1)}%`;
	}

	/**
	 * Format schema summary for quick preview
	 */
	static formatSchemaSummary(schema: any): string {
		if (!schema || !schema.schema) {
			return 'Invalid schema';
		}

		const fieldCount = Object.keys(schema.schema).length;
		const fieldTypes = Object.values(schema.schema) as string[];
		const uniqueTypes = [...new Set(fieldTypes)];

		return `${fieldCount} field${fieldCount !== 1 ? 's' : ''} (${uniqueTypes.slice(0, 3).join(', ')}${uniqueTypes.length > 3 ? '...' : ''})`;
	}

	/**
	 * Format parse result summary
	 */
	static formatParseResultSummary(result: ParseResult): string {
		// Adapt to new ParseResponse structure. Some information is no longer available.
		// const confidence = result.metadata?.confidence ? this.formatConfidence(result.metadata.confidence) : 'N/A'; // Not available
		// const time = result.metadata?.processingTimeMs ? this.formatProcessingTime(result.metadata.processingTimeMs) : 'N/A'; // Not available
		const tokens = result.usage?.total_tokens !== undefined ? this.formatTokens(result.usage.total_tokens) : 'N/A';
		const fieldsCount = Object.keys(result.result || {}).length;

		// return `✅ ${fieldsCount} fields extracted with ${confidence} confidence in ${time} (${tokens} tokens)`;
		return `✅ ${fieldsCount} fields extracted (${tokens} tokens used)`;
	}

	/**
	 * Format error message for user display
	 */
	static formatErrorMessage(error: any): string {
		if (typeof error === 'string') {
			return error;
		}

		if (error && error.message) {
			return error.message;
		}

		if (error && error.error && error.error.message) {
			return error.error.message;
		}

		return 'An unknown error occurred';
	}

	/**
	 * Format JSON with proper indentation and syntax highlighting hints
	 */
	static formatJsonForDisplay(obj: any, indent: number = 2): string {
		try {
			return JSON.stringify(obj, null, indent);
		} catch (error) {
			return String(obj);
		}
	}

	/**
	 * Clean and format text for parsing input preview
	 */
	static formatInputPreview(text: string, maxLines: number = 5): string {
		const lines = text.split('\n').slice(0, maxLines);
		const preview = lines.join('\n');
		
		if (text.split('\n').length > maxLines) {
			return preview + '\n... (truncated)';
		}
		
		return preview;
	}
}
/**
 * Validation utilities for Parserator extension
 */

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

export class ValidationUtils {
	/**
	 * Validate API key format
	 */
	static validateApiKey(apiKey: string): ValidationResult {
		const errors: string[] = [];

		if (!apiKey) {
			errors.push('API key is required');
			return { isValid: false, errors };
		}

		if (typeof apiKey !== 'string') {
			errors.push('API key must be a string');
		}

		if (!/^pk_(live|test)_[a-zA-Z0-9]{20,}$/.test(apiKey)) {
			errors.push('API key must start with pk_live_ or pk_test_ followed by at least 20 alphanumeric characters');
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Validate schema object
	 */
	static validateSchema(schema: any): ValidationResult {
		const errors: string[] = [];

		if (!schema) {
			errors.push('Schema is required');
			return { isValid: false, errors };
		}

		if (typeof schema !== 'object' || Array.isArray(schema)) {
			errors.push('Schema must be an object');
			return { isValid: false, errors };
		}

		// Check required fields
		if (!schema.name || typeof schema.name !== 'string') {
			errors.push('Schema must have a valid "name" field');
		}

		if (!schema.schema || typeof schema.schema !== 'object' || Array.isArray(schema.schema)) {
			errors.push('Schema must have a valid "schema" field containing field definitions');
		}

		// Validate schema field definitions
		if (schema.schema && typeof schema.schema === 'object') {
			const validTypes = [
				'string', 'number', 'boolean', 'email', 'phone', 
				'date', 'datetime', 'currency', 'url', 'string_array'
			];

			for (const [fieldName, fieldType] of Object.entries(schema.schema)) {
				if (typeof fieldName !== 'string' || fieldName.trim() === '') {
					errors.push(`Invalid field name: "${fieldName}"`);
				}

				if (typeof fieldType === 'string') {
					if (!validTypes.includes(fieldType)) {
						errors.push(`Invalid field type "${fieldType}" for field "${fieldName}". Valid types: ${validTypes.join(', ')}`);
					}
				} else if (Array.isArray(fieldType)) {
					// Handle array field definitions (for nested objects)
					if (fieldType.length === 0) {
						errors.push(`Array field type for "${fieldName}" cannot be empty`);
					}
				} else {
					errors.push(`Field type for "${fieldName}" must be a string or array`);
				}
			}

			// Check schema size limits
			const fieldCount = Object.keys(schema.schema).length;
			if (fieldCount === 0) {
				errors.push('Schema must define at least one field');
			}
			if (fieldCount > 50) {
				errors.push('Schema cannot have more than 50 fields');
			}
		}

		// Validate optional fields
		if (schema.description && typeof schema.description !== 'string') {
			errors.push('Description must be a string if provided');
		}

		if (schema.instructions && typeof schema.instructions !== 'string') {
			errors.push('Instructions must be a string if provided');
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Validate input data for parsing
	 */
	static validateInputData(inputData: string): ValidationResult {
		const errors: string[] = [];

		if (!inputData) {
			errors.push('Input data is required');
			return { isValid: false, errors };
		}

		if (typeof inputData !== 'string') {
			errors.push('Input data must be a string');
		}

		if (inputData.trim().length === 0) {
			errors.push('Input data cannot be empty or only whitespace');
		}

		if (inputData.length > 100000) {
			errors.push('Input data exceeds maximum length of 100KB');
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Validate URL format
	 */
	static validateUrl(url: string): ValidationResult {
		const errors: string[] = [];

		if (!url) {
			errors.push('URL is required');
			return { isValid: false, errors };
		}

		try {
			new URL(url);
		} catch {
			errors.push('Invalid URL format');
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Validate timeout value
	 */
	static validateTimeout(timeout: number): ValidationResult {
		const errors: string[] = [];

		if (typeof timeout !== 'number') {
			errors.push('Timeout must be a number');
			return { isValid: false, errors };
		}

		if (timeout < 1000) {
			errors.push('Timeout must be at least 1000ms (1 second)');
		}

		if (timeout > 300000) {
			errors.push('Timeout cannot exceed 300000ms (5 minutes)');
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Sanitize text input
	 */
	static sanitizeText(text: string): string {
		if (typeof text !== 'string') {
			return '';
		}

		// Remove potential dangerous characters while preserving structure
		return text
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
			.trim();
	}

	/**
	 * Validate schema name for uniqueness
	 */
	static validateSchemaName(name: string, existingNames: string[]): ValidationResult {
		const errors: string[] = [];

		if (!name || typeof name !== 'string') {
			errors.push('Schema name is required');
			return { isValid: false, errors };
		}

		if (name.trim().length === 0) {
			errors.push('Schema name cannot be empty');
		}

		if (name.length > 100) {
			errors.push('Schema name cannot exceed 100 characters');
		}

		if (existingNames.includes(name)) {
			errors.push('A schema with this name already exists');
		}

		// Check for valid characters
		if (!/^[a-zA-Z0-9\s\-_.,()]+$/.test(name)) {
			errors.push('Schema name contains invalid characters. Use only letters, numbers, spaces, and basic punctuation');
		}

		return { isValid: errors.length === 0, errors };
	}
}
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ValidationUtils } from '../../utils/validation';
import { FormatUtils } from '../../utils/formatters';
import { ParseratorService } from '../../services/parseratorService';

// Use suite and test from Mocha's TDD interface
declare function suite(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Validation Utils - API Key', () => {
		// Valid API keys
		assert.strictEqual(ValidationUtils.validateApiKey('pk_live_abcdefghijklmnopqrstuvwxyz1234567890').isValid, true);
		assert.strictEqual(ValidationUtils.validateApiKey('pk_test_abcdefghijklmnopqrstuvwxyz1234567890').isValid, true);

		// Invalid API keys
		assert.strictEqual(ValidationUtils.validateApiKey('').isValid, false);
		assert.strictEqual(ValidationUtils.validateApiKey('invalid_key').isValid, false);
		assert.strictEqual(ValidationUtils.validateApiKey('pk_live_short').isValid, false);
	});

	test('Validation Utils - Schema', () => {
		// Valid schema
		const validSchema = {
			name: 'Test Schema',
			description: 'A test schema',
			schema: {
				field1: 'string',
				field2: 'number',
				field3: 'email'
			}
		};
		assert.strictEqual(ValidationUtils.validateSchema(validSchema).isValid, true);

		// Invalid schemas
		assert.strictEqual(ValidationUtils.validateSchema(null).isValid, false);
		assert.strictEqual(ValidationUtils.validateSchema({}).isValid, false);
		assert.strictEqual(ValidationUtils.validateSchema({ name: 'Test' }).isValid, false);
	});

	test('Format Utils - Confidence', () => {
		assert.strictEqual(FormatUtils.formatConfidence(0.95), '95.0%');
		assert.strictEqual(FormatUtils.formatConfidence(0.8523), '85.2%');
		assert.strictEqual(FormatUtils.formatConfidence(1.0), '100.0%');
	});

	test('Format Utils - Processing Time', () => {
		assert.strictEqual(FormatUtils.formatProcessingTime(500), '500ms');
		assert.strictEqual(FormatUtils.formatProcessingTime(1500), '1.5s');
		assert.strictEqual(FormatUtils.formatProcessingTime(65000), '1m 5.0s');
	});

	test('Format Utils - Tokens', () => {
		assert.strictEqual(FormatUtils.formatTokens(1234), '1,234');
		assert.strictEqual(FormatUtils.formatTokens(1234567), '1,234,567');
	});

	test('Format Utils - API Key Masking', () => {
		const apiKey = 'pk_live_abcdefghijklmnopqrstuvwxyz1234567890';
		const masked = FormatUtils.formatApiKey(apiKey);
		assert.strictEqual(masked, 'pk_live_abcd...');
		assert.notStrictEqual(masked, apiKey);
	});

	test('Parserator Service - Configuration', () => {
		const service = new ParseratorService();
		assert.strictEqual(service.isConfigured(), false);
	});
});
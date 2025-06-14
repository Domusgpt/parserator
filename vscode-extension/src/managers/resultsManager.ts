import * as vscode from 'vscode';
import { ParseResult } from '../services/parseratorService';

export class ResultsManager {
	async showResults(result: ParseResult, schemaName: string): Promise<void> {
		const config = vscode.workspace.getConfiguration('parserator');
		const autoOpen = config.get('autoOpenResults') as boolean;

		if (!autoOpen) {
			return;
		}

		// Create formatted results document
		const formattedResults = this.formatResults(result, schemaName);

		// Open results in new editor tab
		const doc = await vscode.workspace.openTextDocument({
			content: formattedResults,
			language: 'json'
		});

		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Beside,
			preview: false
		});
	}

	private formatResults(result: ParseResult, schemaName: string): string {
		const timestamp = new Date().toISOString();
		
		const output = {
			// Header information
			parserator_results: {
				schema_used: schemaName,
				timestamp: timestamp,
				success: result.success
			},
			
			// Main parsed data
			// Use result.result for parsed data, default to empty object if not present
			parsed_data: result.result || {},
			
			// Metadata and analytics
			// Most of the old metadata fields are not available in the new ParseResponse.
			// We can include token usage if available.
			metadata: {
				// confidence_score: result.metadata?.confidence, // Not available
				// processing_time_ms: result.metadata?.processingTimeMs, // Not available
				tokens_used: result.usage?.total_tokens,
				prompt_tokens: result.usage?.prompt_tokens,
				completion_tokens: result.usage?.completion_tokens,
				// complexity: result.metadata?.architectPlan?.estimatedComplexity, // Not available
				// architect_confidence: result.metadata?.architectPlan?.architectConfidence, // Not available
				// stage_breakdown: result.metadata?.stageBreakdown // Not available
			},
			
			// Architecture plan details - Not available in new ParseResponse
			// architect_plan: {
			// 	total_steps: result.metadata?.architectPlan?.totalSteps,
			// 	steps: result.metadata?.architectPlan?.steps.map(step => ({
			// 		field: step.targetKey,
			// 		description: step.description,
			// 		search_instruction: step.searchInstruction,
			// 		validation_type: step.validationType,
			// 		required: step.isRequired
			// 	}))
			// }
		};

		// Billing info is not available in the new ParseResponse
		// if (result.billing) {
		// 	(output as any).metadata.billing = {
		// 		subscription_tier: result.billing.subscriptionTier,
		// 		monthly_usage: result.billing.monthlyUsage,
		// 		monthly_limit: result.billing.monthlyLimit,
		// 		api_key_name: result.billing.apiKeyName
		// 	};
		// }

		return JSON.stringify(output, null, 2);
	}

	async exportResults(result: ParseResult, schemaName: string): Promise<void> {
		const formattedResults = this.formatResults(result, schemaName);
		
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(`parserator-results-${Date.now()}.json`),
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*']
			}
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(formattedResults, 'utf8'));
			vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
		}
	}

	async copyResultsToClipboard(result: ParseResult): Promise<void> {
		// Use result.result for parsed data
		const jsonString = JSON.stringify(result.result || {}, null, 2);
		await vscode.env.clipboard.writeText(jsonString);
		vscode.window.showInformationMessage('Parsed data copied to clipboard!');
	}

	generateSummary(result: ParseResult): string {
		// Adapt to new ParseResponse structure. Some information is no longer available.
		// const confidence = (result.metadata.confidence * 100).toFixed(1); // Not available
		// const processingTime = result.metadata.processingTimeMs; // Not available
		const tokensUsed = result.usage?.total_tokens || 'N/A';
		const fieldsExtracted = Object.keys(result.result || {}).length;

		// return `✅ Parsing completed with ${confidence}% confidence in ${processingTime}ms using ${tokensUsed} tokens. Extracted ${fieldsExtracted} fields.`;
		return `✅ Parsing completed. Used ${tokensUsed} tokens. Extracted ${fieldsExtracted} fields.`;
	}
}
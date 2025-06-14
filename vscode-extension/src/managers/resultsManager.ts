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
			parsed_data: result.parsedData,
			
			// Metadata and analytics
			metadata: {
				confidence_score: result.metadata.confidence,
				processing_time_ms: result.metadata.processingTimeMs,
				tokens_used: result.metadata.tokensUsed,
				complexity: result.metadata.architectPlan.estimatedComplexity,
				architect_confidence: result.metadata.architectPlan.architectConfidence,
				stage_breakdown: result.metadata.stageBreakdown
			},
			
			// Architecture plan details
			architect_plan: {
				total_steps: result.metadata.architectPlan.totalSteps,
				steps: result.metadata.architectPlan.steps.map(step => ({
					field: step.targetKey,
					description: step.description,
					search_instruction: step.searchInstruction,
					validation_type: step.validationType,
					required: step.isRequired
				}))
			}
		};

		// Add billing info if available
		if (result.billing) {
			output.metadata = {
				...output.metadata,
				billing: {
					subscription_tier: result.billing.subscriptionTier,
					monthly_usage: result.billing.monthlyUsage,
					monthly_limit: result.billing.monthlyLimit,
					api_key_name: result.billing.apiKeyName
				}
			} as any;
		}

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
		const jsonString = JSON.stringify(result.parsedData, null, 2);
		await vscode.env.clipboard.writeText(jsonString);
		vscode.window.showInformationMessage('Parsed data copied to clipboard!');
	}

	generateSummary(result: ParseResult): string {
		const confidence = (result.metadata.confidence * 100).toFixed(1);
		const processingTime = result.metadata.processingTimeMs;
		const tokensUsed = result.metadata.tokensUsed;
		const fieldsExtracted = Object.keys(result.parsedData).length;

		return `✅ Parsing completed with ${confidence}% confidence in ${processingTime}ms using ${tokensUsed} tokens. Extracted ${fieldsExtracted} fields.`;
	}
}
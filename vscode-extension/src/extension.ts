import * as vscode from 'vscode';
import { ParseratorService } from './services/parseratorService';
import { SchemaProvider } from './providers/schemaProvider';
import { SchemaManager } from './managers/schemaManager';
import { ResultsManager } from './managers/resultsManager';
import { NotificationManager } from './managers/notificationManager';

let parseratorService: ParseratorService;
let schemaProvider: SchemaProvider;
let schemaManager: SchemaManager;
let resultsManager: ResultsManager;
let notificationManager: NotificationManager;

export function activate(context: vscode.ExtensionContext) {
	// Initialize services
	parseratorService = new ParseratorService();
	schemaManager = new SchemaManager(context);
	resultsManager = new ResultsManager();
	notificationManager = new NotificationManager();
	schemaProvider = new SchemaProvider(schemaManager);

	// Load default schemas on first activation
	schemaManager.loadDefaultSchemas();

	// Register tree data provider
	vscode.window.createTreeView('parseratorSchemas', {
		treeDataProvider: schemaProvider,
		showCollapseAll: false
	});

	// Set context for when extension is enabled
	vscode.commands.executeCommand('setContext', 'parserator.enabled', true);

	// Register commands
	registerCommands(context);

	// Register configuration change listener
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('parserator')) {
				parseratorService.updateConfiguration();
			}
		})
	);

	console.log('Parserator extension activated!');
}

function registerCommands(context: vscode.ExtensionContext) {
	// Parse Selection command
	const parseSelectionCommand = vscode.commands.registerCommand(
		'parserator.parseSelection',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor found');
				return;
			}

			const selection = editor.selection;
			if (selection.isEmpty) {
				vscode.window.showErrorMessage('Please select text to parse');
				return;
			}

			const selectedText = editor.document.getText(selection);
			await parseWithSchemaSelection(selectedText);
		}
	);

	// Open Schema Panel command
	const openSchemaPanelCommand = vscode.commands.registerCommand(
		'parserator.openSchemaPanel',
		async () => {
			await vscode.commands.executeCommand('workbench.view.explorer');
			await vscode.commands.executeCommand('parseratorSchemas.focus');
		}
	);

	// Test Connection command
	const testConnectionCommand = vscode.commands.registerCommand(
		'parserator.testConnection',
		async () => {
			try {
				const isConnected = await parseratorService.testConnection();
				if (isConnected) {
					notificationManager.showSuccess('✅ Connected to Parserator API successfully!');
				} else {
					notificationManager.showError('❌ Failed to connect to Parserator API. Check your API key and internet connection.');
				}
			} catch (error) {
				notificationManager.showError(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	);

	// Refresh Schemas command
	const refreshSchemasCommand = vscode.commands.registerCommand(
		'parserator.refreshSchemas',
		() => {
			schemaProvider.refresh();
		}
	);

	// Add Schema command
	const addSchemaCommand = vscode.commands.registerCommand(
		'parserator.addSchema',
		async () => {
			const name = await vscode.window.showInputBox({
				prompt: 'Enter schema name',
				placeHolder: 'e.g., Email Parser'
			});

			if (!name) return;

			const description = await vscode.window.showInputBox({
				prompt: 'Enter schema description (optional)',
				placeHolder: 'e.g., Extract contact info from emails'
			});

			// Open a new document with schema template
			const template = {
				name,
				description: description || '',
				schema: {
					field1: 'string',
					field2: 'number',
					field3: 'email'
				}
			};

			const doc = await vscode.workspace.openTextDocument({
				content: JSON.stringify(template, null, 2),
				language: 'json'
			});

			await vscode.window.showTextDocument(doc);
			
			const saveSchema = await vscode.window.showInformationMessage(
				'Edit the schema as needed, then save it',
				'Save Schema'
			);

			if (saveSchema) {
				const content = doc.getText();
				try {
					const schema = JSON.parse(content);
					await schemaManager.addSchema(schema);
					schemaProvider.refresh();
					notificationManager.showSuccess(`Schema "${name}" added successfully!`);
				} catch (error) {
					notificationManager.showError('Invalid JSON format. Please check your schema.');
				}
			}
		}
	);

	// Edit Schema command
	const editSchemaCommand = vscode.commands.registerCommand(
		'parserator.editSchema',
		async (schemaItem) => {
			if (!schemaItem || !schemaItem.id) return;

			const schema = await schemaManager.getSchema(schemaItem.id);
			if (!schema) {
				notificationManager.showError('Schema not found');
				return;
			}

			const doc = await vscode.workspace.openTextDocument({
				content: JSON.stringify(schema, null, 2),
				language: 'json'
			});

			await vscode.window.showTextDocument(doc);

			const saveSchema = await vscode.window.showInformationMessage(
				'Edit the schema as needed, then save it',
				'Save Changes'
			);

			if (saveSchema) {
				const content = doc.getText();
				try {
					const updatedSchema = JSON.parse(content);
					await schemaManager.updateSchema(schemaItem.id, updatedSchema);
					schemaProvider.refresh();
					notificationManager.showSuccess(`Schema "${updatedSchema.name}" updated successfully!`);
				} catch (error) {
					notificationManager.showError('Invalid JSON format. Please check your schema.');
				}
			}
		}
	);

	// Delete Schema command
	const deleteSchemaCommand = vscode.commands.registerCommand(
		'parserator.deleteSchema',
		async (schemaItem) => {
			if (!schemaItem || !schemaItem.id) return;

			const schema = await schemaManager.getSchema(schemaItem.id);
			if (!schema) return;

			const result = await vscode.window.showWarningMessage(
				`Are you sure you want to delete the schema "${schema.name}"?`,
				'Delete',
				'Cancel'
			);

			if (result === 'Delete') {
				await schemaManager.deleteSchema(schemaItem.id);
				schemaProvider.refresh();
				notificationManager.showSuccess(`Schema "${schema.name}" deleted successfully!`);
			}
		}
	);

	// Use Schema command
	const useSchemaCommand = vscode.commands.registerCommand(
		'parserator.useSchema',
		async (schemaItem) => {
			if (!schemaItem || !schemaItem.id) return;

			const schema = await schemaManager.getSchema(schemaItem.id);
			if (!schema) {
				notificationManager.showError('Schema not found');
				return;
			}

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor found');
				return;
			}

			const selection = editor.selection;
			if (selection.isEmpty) {
				vscode.window.showErrorMessage('Please select text to parse');
				return;
			}

			const selectedText = editor.document.getText(selection);
			await parseTextWithSchema(selectedText, schema);
		}
	);

	// Register all commands
	context.subscriptions.push(
		parseSelectionCommand,
		openSchemaPanelCommand,
		testConnectionCommand,
		refreshSchemasCommand,
		addSchemaCommand,
		editSchemaCommand,
		deleteSchemaCommand,
		useSchemaCommand
	);
}

async function parseWithSchemaSelection(text: string) {
	const schemas = await schemaManager.getAllSchemas();
	
	if (schemas.length === 0) {
		// No schemas available, use default or prompt for quick schema
		const useDefault = await vscode.window.showInformationMessage(
			'No schemas configured. Use default schema or create one?',
			'Use Default',
			'Create Schema'
		);

		if (useDefault === 'Use Default') {
			const config = vscode.workspace.getConfiguration('parserator');
			const defaultSchema = config.get('defaultSchema') as any;
			await parseTextWithSchema(text, { name: 'Default', schema: defaultSchema });
		} else if (useDefault === 'Create Schema') {
			await vscode.commands.executeCommand('parserator.addSchema');
		}
		return;
	}

	// Show schema selection
	const schemaOptions = schemas.map(schema => ({
		label: schema.name,
		description: schema.description,
		schema
	}));

	const selectedOption = await vscode.window.showQuickPick(schemaOptions, {
		placeHolder: 'Select a schema to use for parsing'
	});

	if (selectedOption) {
		await parseTextWithSchema(text, selectedOption.schema);
	}
}

async function parseTextWithSchema(text: string, schema: any) {
	const config = vscode.workspace.getConfiguration('parserator');
	const apiKey = config.get('apiKey') as string;

	if (!apiKey) {
		const result = await vscode.window.showErrorMessage(
			'Parserator API key not configured',
			'Open Settings'
		);
		if (result === 'Open Settings') {
			await vscode.commands.executeCommand('workbench.action.openSettings', 'parserator.apiKey');
		}
		return;
	}

	// Show progress
	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `Parsing with ${schema.name}...`,
		cancellable: false
	}, async (progress) => {
		try {
			progress.report({ increment: 0, message: 'Sending request...' });

			const result = await parseratorService.parse({
				inputData: text,
				outputSchema: schema.schema,
				instructions: schema.instructions
			});

			progress.report({ increment: 50, message: 'Processing response...' });

			await resultsManager.showResults(result, schema.name);

			progress.report({ increment: 100, message: 'Complete!' });

			notificationManager.showSuccess(`✅ Parsing completed successfully!`);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			notificationManager.showError(`❌ Parsing failed: ${errorMessage}`);
		}
	});
}

export function deactivate() {
	console.log('Parserator extension deactivated');
}
import * as vscode from 'vscode';
import { SchemaManager, Schema } from '../managers/schemaManager';

export class SchemaItem extends vscode.TreeItem {
	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly contextValue: string
	) {
		super(label, collapsibleState);
		this.tooltip = description || label;
		this.description = description;
	}

	iconPath = new vscode.ThemeIcon('json');
}

export class SchemaProvider implements vscode.TreeDataProvider<SchemaItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<SchemaItem | undefined | null | void> = new vscode.EventEmitter<SchemaItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<SchemaItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(private schemaManager: SchemaManager) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: SchemaItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: SchemaItem): Promise<SchemaItem[]> {
		if (!element) {
			// Root level - return all schemas
			const schemas = await this.schemaManager.getAllSchemas();
			return schemas.map(schema => new SchemaItem(
				schema.id,
				schema.name,
				schema.description || '',
				vscode.TreeItemCollapsibleState.None,
				'schema'
			));
		}

		return [];
	}
}
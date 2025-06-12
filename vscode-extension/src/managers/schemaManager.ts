import * as vscode from 'vscode';

export interface Schema {
	id: string;
	name: string;
	description?: string;
	schema: Record<string, any>;
	instructions?: string;
	createdAt: Date;
	updatedAt: Date;
}

export class SchemaManager {
	private static readonly STORAGE_KEY = 'parserator.schemas';

	constructor(private context: vscode.ExtensionContext) {}

	async getAllSchemas(): Promise<Schema[]> {
		const schemas = this.context.globalState.get<Schema[]>(SchemaManager.STORAGE_KEY) || [];
		return schemas.map(schema => ({
			...schema,
			createdAt: new Date(schema.createdAt),
			updatedAt: new Date(schema.updatedAt)
		}));
	}

	async getSchema(id: string): Promise<Schema | undefined> {
		const schemas = await this.getAllSchemas();
		return schemas.find(schema => schema.id === id);
	}

	async addSchema(schemaData: Omit<Schema, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schema> {
		const schemas = await this.getAllSchemas();
		
		const newSchema: Schema = {
			...schemaData,
			id: this.generateId(),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		schemas.push(newSchema);
		await this.context.globalState.update(SchemaManager.STORAGE_KEY, schemas);
		
		return newSchema;
	}

	async updateSchema(id: string, schemaData: Partial<Omit<Schema, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Schema | undefined> {
		const schemas = await this.getAllSchemas();
		const index = schemas.findIndex(schema => schema.id === id);
		
		if (index === -1) {
			return undefined;
		}

		schemas[index] = {
			...schemas[index],
			...schemaData,
			updatedAt: new Date()
		};

		await this.context.globalState.update(SchemaManager.STORAGE_KEY, schemas);
		return schemas[index];
	}

	async deleteSchema(id: string): Promise<boolean> {
		const schemas = await this.getAllSchemas();
		const filteredSchemas = schemas.filter(schema => schema.id !== id);
		
		if (filteredSchemas.length === schemas.length) {
			return false; // Schema not found
		}

		await this.context.globalState.update(SchemaManager.STORAGE_KEY, filteredSchemas);
		return true;
	}

	async importSchema(schemaJson: string): Promise<Schema> {
		try {
			const parsed = JSON.parse(schemaJson);
			
			// Validate required fields
			if (!parsed.name || !parsed.schema) {
				throw new Error('Schema must have "name" and "schema" fields');
			}

			return await this.addSchema({
				name: parsed.name,
				description: parsed.description,
				schema: parsed.schema,
				instructions: parsed.instructions
			});
		} catch (error) {
			throw new Error(`Invalid schema JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async exportSchema(id: string): Promise<string> {
		const schema = await this.getSchema(id);
		if (!schema) {
			throw new Error('Schema not found');
		}

		const exportData = {
			name: schema.name,
			description: schema.description,
			schema: schema.schema,
			instructions: schema.instructions
		};

		return JSON.stringify(exportData, null, 2);
	}

	async loadDefaultSchemas(): Promise<void> {
		const schemas = await this.getAllSchemas();
		if (schemas.length > 0) {
			return; // Already have schemas
		}

		// Load built-in default schemas
		const defaultSchemas = [
			{
				name: 'Email Contact Extractor',
				description: 'Extract contact information from any email',
				schema: {
					sender_name: 'string',
					sender_email: 'email',
					sender_company: 'string',
					phone_numbers: 'string_array',
					meeting_time: 'datetime',
					action_items: 'string_array',
					attachments: 'string_array'
				}
			},
			{
				name: 'Invoice Data Extractor',
				description: 'Extract structured data from invoices and receipts',
				schema: {
					invoice_number: 'string',
					invoice_date: 'date',
					due_date: 'date',
					vendor_name: 'string',
					vendor_address: 'string',
					customer_name: 'string',
					customer_address: 'string',
					subtotal: 'currency',
					tax_amount: 'currency',
					total_amount: 'currency',
					payment_terms: 'string'
				}
			},
			{
				name: 'Meeting Notes Parser',
				description: 'Extract key information from meeting notes',
				schema: {
					meeting_date: 'date',
					attendees: 'string_array',
					agenda_items: 'string_array',
					decisions_made: 'string_array',
					action_items: 'string_array',
					next_meeting: 'datetime'
				}
			},
			{
				name: 'Resume Parser',
				description: 'Extract structured data from resumes',
				schema: {
					full_name: 'string',
					email: 'email',
					phone: 'phone',
					current_position: 'string',
					company: 'string',
					skills: 'string_array',
					education: 'string_array',
					experience_years: 'number'
				}
			},
			{
				name: 'Product Review Analyzer',
				description: 'Extract insights from product reviews',
				schema: {
					product_name: 'string',
					rating: 'number',
					reviewer_name: 'string',
					review_date: 'date',
					pros: 'string_array',
					cons: 'string_array',
					sentiment: 'string',
					would_recommend: 'boolean'
				}
			}
		];

		for (const schemaData of defaultSchemas) {
			await this.addSchema(schemaData);
		}
	}

	private generateId(): string {
		return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
#!/usr/bin/env node

/**
 * Parserator MCP Server - Production Implementation
 * 
 * Model Context Protocol server that exposes Parserator's Architect-Extractor
 * parsing capabilities to AI agents and other MCP-compatible systems.
 * 
 * This server provides intelligent data parsing as a standardized tool
 * that any MCP-compatible agent can use.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ParseratorClient } from './parserator-client.js';
import { 
  ParseDataRequestSchema, 
  ValidateSchemaRequestSchema, 
  SuggestSchemaRequestSchema 
} from './types.js';

/**
 * Parserator MCP Server Class
 * 
 * Implements the Model Context Protocol to expose Parserator's
 * intelligent parsing capabilities to AI agents.
 */
class ParseratorMCPServer {
  private server: Server;
  private parseratorClient: ParseratorClient;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Parserator API key is required. Get one at https://parserator.com');
    }

    // Initialize the real Parserator client
    this.parseratorClient = new ParseratorClient({
      apiKey,
      baseUrl: 'https://app-5108296280.us-central1.run.app',
      timeout: 30000
    });

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'parserator',
        version: '1.0.0',
        description: 'Intelligent data parsing for AI agents using the Architect-Extractor pattern'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool discovery handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'parse_data',
            description: 'Transform unstructured data into structured JSON using AI. Uses the Architect-Extractor pattern for high accuracy and token efficiency.',
            inputSchema: {
              type: 'object',
              properties: {
                inputData: {
                  type: 'string',
                  description: 'The unstructured data to parse (text, email, document content, etc.)'
                },
                outputSchema: {
                  type: 'object',
                  description: 'Desired JSON structure - specify the fields you want extracted'
                },
                instructions: {
                  type: 'string',
                  description: 'Optional: Additional context or specific parsing instructions'
                }
              },
              required: ['inputData', 'outputSchema']
            }
          },
          {
            name: 'validate_schema',
            description: 'Validate if data matches expected schema structure',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  description: 'The data to validate'
                },
                schema: {
                  type: 'object',
                  description: 'The schema to validate against'
                }
              },
              required: ['data', 'schema']
            }
          },
          {
            name: 'suggest_schema',
            description: 'AI-powered schema suggestion based on sample data',
            inputSchema: {
              type: 'object',
              properties: {
                sampleData: {
                  type: 'string',
                  description: 'Sample of the data to analyze for schema suggestion'
                }
              },
              required: ['sampleData']
            }
          },
          {
            name: 'test_connection',
            description: 'Test connection to Parserator API and check account status',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          }
        ]
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'parse_data':
            return await this.handleParseData(args);
          case 'validate_schema':
            return await this.handleValidateSchema(args);
          case 'suggest_schema':
            return await this.handleSuggestSchema(args);
          case 'test_connection':
            return await this.handleTestConnection();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                tool: name
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // Resource discovery handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'parserator://usage',
            name: 'API Usage Statistics',
            description: 'Current API usage and billing information',
            mimeType: 'application/json'
          },
          {
            uri: 'parserator://templates',
            name: 'Parsing Templates',
            description: 'Pre-built parsing patterns for common data types',
            mimeType: 'application/json'
          },
          {
            uri: 'parserator://examples',
            name: 'Usage Examples',
            description: 'Example parsing requests and responses',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Resource reading handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'parserator://usage':
          const usage = await this.parseratorClient.getUsageStats();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(usage, null, 2)
              }
            ]
          };

        case 'parserator://templates':
          const templates = await this.parseratorClient.getTemplates();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(templates, null, 2)
              }
            ]
          };

        case 'parserator://examples':
          const examples = this.getUsageExamples();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(examples, null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async handleParseData(args: any) {
    // Validate input using Zod schema
    const validation = ParseDataRequestSchema.safeParse(args);
    if (!validation.success) {
      throw new Error(`Invalid input: ${validation.error.message}`);
    }

    const { inputData, outputSchema, instructions } = validation.data;

    // Call the real Parserator API
    const result = await this.parseratorClient.parseData(inputData, outputSchema, instructions);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            parsedData: result.parsedData,
            metadata: {
              confidence: result.confidence,
              tokensUsed: result.tokensUsed,
              processingTime: result.processingTime,
              requestId: result.requestId,
              timestamp: new Date().toISOString()
            },
            error: result.error,
            code: result.code
          }, null, 2)
        }
      ]
    };
  }

  private async handleValidateSchema(args: any) {
    const validation = ValidateSchemaRequestSchema.safeParse(args);
    if (!validation.success) {
      throw new Error(`Invalid input: ${validation.error.message}`);
    }

    const { data, schema } = validation.data;
    const result = await this.parseratorClient.validateSchema(data, schema);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            valid: result.valid,
            errors: result.errors,
            suggestions: result.suggestions
          }, null, 2)
        }
      ]
    };
  }

  private async handleSuggestSchema(args: any) {
    const validation = SuggestSchemaRequestSchema.safeParse(args);
    if (!validation.success) {
      throw new Error(`Invalid input: ${validation.error.message}`);
    }

    const { sampleData } = validation.data;
    const result = await this.parseratorClient.suggestSchema(sampleData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            suggestedSchema: result.suggestedSchema,
            confidence: result.confidence,
            reasoning: result.reasoning
          }, null, 2)
        }
      ]
    };
  }

  private async handleTestConnection() {
    const result = await this.parseratorClient.testConnection();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            connection: result.success ? 'healthy' : 'failed',
            latency: `${result.latency}ms`,
            error: result.error,
            apiEndpoint: 'https://app-5108296280.us-central1.run.app',
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private getUsageExamples() {
    return {
      examples: [
        {
          name: 'Email Processing',
          description: 'Extract structured data from an email',
          tool: 'parse_data',
          request: {
            inputData: 'From: john@company.com\nSubject: Urgent: Project Deadline\nHi team, we need to finish the Q4 report by December 15th. Please prioritize this task.',
            outputSchema: {
              sender: 'string',
              subject: 'string',
              deadline: 'string',
              priority: 'string',
              tasks: 'string_array'
            },
            instructions: 'Extract actionable information from this email'
          },
          expectedOutput: {
            sender: 'john@company.com',
            subject: 'Urgent: Project Deadline',
            deadline: 'December 15th',
            priority: 'urgent',
            tasks: ['finish Q4 report']
          }
        },
        {
          name: 'Invoice Processing',
          description: 'Parse invoice data for business automation',
          tool: 'parse_data',
          request: {
            inputData: 'INVOICE #12345\nAcme Corp\n123 Business St\nTotal: $1,250.00\nDue: 2024-01-15\nItems: Office supplies, Software license',
            outputSchema: {
              invoiceNumber: 'string',
              vendor: 'string',
              amount: 'number',
              dueDate: 'string',
              items: 'string_array'
            }
          },
          expectedOutput: {
            invoiceNumber: '12345',
            vendor: 'Acme Corp',
            amount: 1250.00,
            dueDate: '2024-01-15',
            items: ['Office supplies', 'Software license']
          }
        },
        {
          name: 'Schema Suggestion',
          description: 'Get AI-powered schema suggestions',
          tool: 'suggest_schema',
          request: {
            sampleData: 'John Smith, john@email.com, (555) 123-4567, Software Engineer at Tech Corp'
          },
          expectedOutput: {
            suggestedSchema: {
              name: 'string',
              email: 'string',
              phone: 'string',
              title: 'string',
              company: 'string'
            }
          }
        }
      ],
      tips: [
        'Use specific field names in your outputSchema for better results',
        'Add instructions for complex parsing requirements',
        'Test with suggest_schema first if you\'re unsure about the structure',
        'The Architect-Extractor pattern ensures high accuracy with minimal tokens'
      ]
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log startup info to stderr (won't interfere with MCP protocol)
    console.error('🚀 Parserator MCP Server started successfully');
    console.error('📡 Connected to Parserator API at https://app-5108296280.us-central1.run.app');
    console.error('🤖 Ready to serve AI agents with intelligent parsing capabilities');
  }
}

// CLI entry point
async function main() {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.error('❌ Error: Parserator API key is required');
    console.error('Usage: parserator-mcp-server <API_KEY>');
    console.error('Get your API key at: https://parserator.com');
    process.exit(1);
  }

  try {
    const server = new ParseratorMCPServer(apiKey);
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start Parserator MCP Server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ParseratorMCPServer };
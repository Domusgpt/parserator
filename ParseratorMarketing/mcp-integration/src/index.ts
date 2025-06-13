#!/usr/bin/env node

/**
 * Parserator MCP Server Entry Point
 * 
 * This is the main entry point for the Parserator Model Context Protocol server.
 * It exposes Parserator's Architect-Extractor parsing capabilities to AI agents
 * and other MCP-compatible systems.
 * 
 * Usage:
 *   npx @parserator/mcp-server <API_KEY>
 *   
 * Or as a module:
 *   import { ParseratorMCPServer } from '@parserator/mcp-server';
 */

export { ParseratorMCPServer } from './server.js';
export { ParseratorClient } from './parserator-client.js';
export * from './types.js';

// CLI entry point when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { ParseratorMCPServer } = await import('./server.js');
  
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.error('🔑 Parserator MCP Server v1.0.0');
    console.error('');
    console.error('❌ Error: API key is required');
    console.error('');
    console.error('Usage:');
    console.error('  npx @parserator/mcp-server <API_KEY>');
    console.error('');
    console.error('Get your API key at: https://parserator.com');
    console.error('');
    console.error('Example:');
    console.error('  npx @parserator/mcp-server pk_live_abc123...');
    console.error('');
    console.error('For Claude Desktop integration, add to your config:');
    console.error(JSON.stringify({
      mcpServers: {
        parserator: {
          command: "npx",
          args: ["@parserator/mcp-server", "pk_live_your_api_key"],
          description: "Intelligent data parsing for AI agents"
        }
      }
    }, null, 2));
    process.exit(1);
  }

  try {
    console.error('🚀 Starting Parserator MCP Server...');
    const server = new ParseratorMCPServer(apiKey);
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
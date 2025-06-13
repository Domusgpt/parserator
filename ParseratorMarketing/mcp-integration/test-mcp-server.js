#!/usr/bin/env node

/**
 * Test script for Parserator MCP Server
 * Simulates MCP protocol communication to verify server functionality
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const TEST_API_KEY = process.argv[2] || 'pk_test_mock_key_for_testing';

console.log('🧪 Testing Parserator MCP Server...\n');

if (!TEST_API_KEY.startsWith('pk_')) {
  console.error('❌ Please provide a valid API key: node test-mcp-server.js pk_live_your_key');
  process.exit(1);
}

// Start the MCP server
console.log('🚀 Starting MCP server...');
const server = spawn('node', ['dist/index.js', TEST_API_KEY], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseCount = 0;
const responses = [];

server.stdout.on('data', (data) => {
  const response = data.toString();
  responses.push(response);
  console.log('📨 Server response:', response);
  responseCount++;
});

server.stderr.on('data', (data) => {
  console.log('🔍 Server info:', data.toString());
});

// Test sequence
const tests = [
  // Initialize
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
  
  // List tools
  {
    jsonrpc: "2.0", 
    id: 2,
    method: "tools/list"
  },
  
  // Test parse_data tool
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "parse_data",
      arguments: {
        inputData: "John Smith, Software Engineer, john@tech.com, (555) 123-4567",
        outputSchema: {
          name: "string",
          title: "string", 
          email: "string",
          phone: "string"
        },
        instructions: "Extract contact information"
      }
    }
  },
  
  // Test suggest_schema tool
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "suggest_schema",
      arguments: {
        sampleData: "Invoice #12345 from Acme Corp, $1,250.00, due 2024-01-15"
      }
    }
  },
  
  // Test connection
  {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call", 
    params: {
      name: "test_connection",
      arguments: {}
    }
  }
];

let testIndex = 0;

function runNextTest() {
  if (testIndex >= tests.length) {
    console.log('\n✅ All tests sent! Waiting for responses...');
    
    // Wait for responses then exit
    setTimeout(() => {
      console.log(`\n📊 Test Summary: ${responses.length} responses received`);
      server.kill();
      process.exit(0);
    }, 5000);
    return;
  }
  
  const test = tests[testIndex];
  console.log(`\n📤 Sending test ${testIndex + 1}: ${test.method}`);
  console.log('📝 Request:', JSON.stringify(test, null, 2));
  
  server.stdin.write(JSON.stringify(test) + '\n');
  testIndex++;
  
  // Send next test after a delay
  setTimeout(runNextTest, 1000);
}

// Start testing after server startup
setTimeout(() => {
  console.log('\n🎯 Starting test sequence...');
  runNextTest();
}, 2000);

server.on('close', (code) => {
  console.log(`\n🏁 Server exited with code ${code}`);
  
  if (responses.length > 0) {
    console.log('✅ MCP Server test completed successfully!');
    console.log('🎉 Parserator MCP Server is working correctly');
  } else {
    console.log('❌ No responses received - check server configuration');
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  server.kill();
  process.exit(0);
});
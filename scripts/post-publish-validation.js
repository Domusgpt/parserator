#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Post-Publish Validation Suite
 * Verifies that published packages work correctly
 */

const VALIDATION_TESTS = {
  'Python SDK': {
    install: 'pip install parserator-sdk --upgrade',
    test: 'python3 -c "from parserator import Parserator; print(\'✅ Python SDK import successful\')"',
    cleanup: 'pip uninstall parserator-sdk -y'
  },
  'Node SDK': {
    install: 'npm install parserator-sdk@latest',
    test: 'node -e "const p = require(\'parserator-sdk\'); console.log(\'✅ Node SDK import successful\')"',
    cleanup: 'npm uninstall parserator-sdk'
  },
  'MCP Server': {
    install: 'npm install parserator-mcp-server@latest -g',
    test: 'parserator-mcp --version',
    cleanup: 'npm uninstall parserator-mcp-server -g'
  }
};

const API_TESTS = [
  {
    name: 'Basic Parsing Test',
    payload: {
      text: 'John Smith, john@email.com, 555-1234',
      schema: {
        name: 'string',
        email: 'string', 
        phone: 'string'
      }
    },
    expect: (result) => {
      return result.name && result.email && result.phone;
    }
  },
  {
    name: 'Complex Schema Test',
    payload: {
      text: 'Product: iPhone 15, Price: $999, Stock: 50 units, Colors: Blue, Black, White',
      schema: {
        product: 'string',
        price: 'number',
        stock: 'number',
        colors: 'array of strings'
      }
    },
    expect: (result) => {
      return result.product && typeof result.price === 'number' && Array.isArray(result.colors);
    }
  }
];

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr 
    };
  }
}

async function testAPI() {
  console.log('🌐 Testing Parserator API...\n');
  
  for (const test of API_TESTS) {
    process.stdout.write(`   ${test.name}... `);
    
    try {
      const response = await fetch('https://app-5108296280.us-central1.run.app/v1/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      
      if (result.success && test.expect(result.data)) {
        console.log('✅ PASSED');
      } else {
        console.log('❌ FAILED - Invalid result structure');
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
  }
}

async function testPackage(name, config) {
  console.log(`📦 Testing ${name}...\n`);
  
  // Create temporary test directory
  const testDir = path.join('/tmp', `parserator-test-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  
  process.chdir(testDir);
  
  try {
    // Install
    process.stdout.write('   Installing... ');
    const installResult = runCommand(config.install, { silent: true });
    if (!installResult.success) {
      console.log('❌ INSTALL FAILED');
      console.log(`   Error: ${installResult.error}`);
      return false;
    }
    console.log('✅ INSTALLED');
    
    // Test
    process.stdout.write('   Testing import... ');
    const testResult = runCommand(config.test, { silent: true });
    if (!testResult.success) {
      console.log('❌ TEST FAILED');
      console.log(`   Error: ${testResult.error}`);
      return false;
    }
    console.log('✅ PASSED');
    
    return true;
    
  } finally {
    // Cleanup
    if (config.cleanup) {
      runCommand(config.cleanup, { silent: true });
    }
    
    // Remove test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

function generateValidationReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    api: results.api,
    packages: results.packages,
    summary: {
      totalTests: Object.keys(VALIDATION_TESTS).length + API_TESTS.length,
      passed: Object.values(results.packages).filter(Boolean).length + 
              (results.api ? API_TESTS.length : 0),
      failed: Object.values(results.packages).filter(p => !p).length +
              (results.api ? 0 : API_TESTS.length)
    }
  };
  
  const reportPath = path.join(process.cwd(), 'validation-reports', `validation-${timestamp.slice(0, 10)}.json`);
  
  // Ensure directory exists
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Validation report saved: ${reportPath}`);
  
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const skipAPI = args.includes('--skip-api');
  const skipPackages = args.includes('--skip-packages');
  const saveReport = args.includes('--save');

  console.log('🧪 Parserator Post-Publish Validation Suite\n');
  
  const results = {
    api: false,
    packages: {}
  };

  // Test API
  if (!skipAPI) {
    try {
      await testAPI();
      results.api = true;
    } catch (error) {
      console.log(`❌ API Tests Failed: ${error.message}`);
      results.api = false;
    }
    console.log();
  }

  // Test Packages
  if (!skipPackages) {
    const originalDir = process.cwd();
    
    for (const [name, config] of Object.entries(VALIDATION_TESTS)) {
      try {
        results.packages[name] = await testPackage(name, config);
      } catch (error) {
        console.log(`❌ Package test failed: ${error.message}`);
        results.packages[name] = false;
      }
      
      // Return to original directory
      process.chdir(originalDir);
      console.log();
    }
  }

  // Summary
  console.log('📊 Validation Summary:');
  
  if (!skipAPI) {
    console.log(`   🌐 API Tests: ${results.api ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  if (!skipPackages) {
    for (const [name, passed] of Object.entries(results.packages)) {
      console.log(`   📦 ${name}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    }
  }

  if (saveReport) {
    generateValidationReport(results);
  }

  // Exit with error code if any tests failed
  const allPassed = results.api && Object.values(results.packages).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAPI, testPackage, VALIDATION_TESTS };
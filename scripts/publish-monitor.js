#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Parserator Publication Status Monitor
 * Tracks extension approval status across all marketplaces
 */

const PACKAGE_STATUS = {
  pypi: {
    name: 'Python SDK',
    url: 'https://pypi.org/pypi/parserator-sdk/json',
    checkField: 'info.version',
    expectedVersion: '1.1.0a0'
  },
  chromeStore: {
    name: 'Chrome Extension',
    // Note: Chrome Web Store doesn't have public API for extension status
    url: 'https://chrome.google.com/webstore/detail/parserator/[extension-id]',
    manual: true,
    expectedVersion: '1.0.2'
  },
  vscodeMarketplace: {
    name: 'VS Code Extension',
    url: 'https://marketplace.visualstudio.com/items?itemName=domusgpt.parserator',
    manual: true,
    expectedVersion: '1.0.0'
  },
  jetbrainsMarketplace: {
    name: 'JetBrains Plugin',
    url: 'https://plugins.jetbrains.com/plugin/[plugin-id]/parserator',
    manual: true,
    expectedVersion: '1.0.0'
  },
  npm: {
    name: 'Node SDK',
    url: 'https://registry.npmjs.org/parserator-sdk',
    checkField: 'dist-tags.latest',
    expectedVersion: '1.0.0'
  },
  npmMcp: {
    name: 'MCP Server',
    url: 'https://registry.npmjs.org/parserator-mcp-server',
    checkField: 'dist-tags.latest', 
    expectedVersion: '1.0.1'
  }
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Parserator-Monitor/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          resolve({ error: 'Invalid JSON response' });
        }
      });
    }).on('error', reject);
  });
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function checkStatus(packageKey, config) {
  if (config.manual) {
    return {
      package: config.name,
      status: 'MANUAL_CHECK_REQUIRED',
      message: `Visit ${config.url} to check approval status`,
      expectedVersion: config.expectedVersion
    };
  }

  try {
    const data = await httpsGet(config.url);
    
    if (data.error) {
      return {
        package: config.name,
        status: 'ERROR',
        message: data.error
      };
    }

    const currentVersion = getNestedValue(data, config.checkField);
    
    if (!currentVersion) {
      return {
        package: config.name,
        status: 'NOT_FOUND',
        message: 'Package not found or version info unavailable'
      };
    }

    const isUpToDate = currentVersion === config.expectedVersion;
    
    return {
      package: config.name,
      status: isUpToDate ? 'PUBLISHED' : 'VERSION_MISMATCH',
      currentVersion,
      expectedVersion: config.expectedVersion,
      message: isUpToDate ? 'Successfully published' : `Expected ${config.expectedVersion}, found ${currentVersion}`
    };

  } catch (error) {
    return {
      package: config.name,
      status: 'ERROR',
      message: error.message
    };
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'PUBLISHED': return '✅';
    case 'VERSION_MISMATCH': return '⚠️';
    case 'NOT_FOUND': return '❌';
    case 'MANUAL_CHECK_REQUIRED': return '👁️';
    case 'ERROR': return '🔴';
    default: return '❓';
  }
}

function saveStatusReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    results,
    summary: {
      total: results.length,
      published: results.filter(r => r.status === 'PUBLISHED').length,
      pending: results.filter(r => r.status === 'MANUAL_CHECK_REQUIRED').length,
      errors: results.filter(r => r.status === 'ERROR').length
    }
  };

  const reportPath = path.join(process.cwd(), 'status-reports', `publish-status-${timestamp.slice(0, 10)}.json`);
  
  // Ensure directory exists
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Status report saved: ${reportPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  const save = args.includes('--save');

  console.log('🔍 Parserator Publication Status Monitor\n');

  const checkAllStatus = async () => {
    const results = [];
    
    for (const [key, config] of Object.entries(PACKAGE_STATUS)) {
      process.stdout.write(`Checking ${config.name}... `);
      const result = await checkStatus(key, config);
      results.push(result);
      
      console.log(`${getStatusIcon(result.status)} ${result.status}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      if (result.currentVersion && result.expectedVersion) {
        console.log(`   Current: v${result.currentVersion} | Expected: v${result.expectedVersion}`);
      }
      console.log();
    }

    // Summary
    const summary = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Summary:');
    for (const [status, count] of Object.entries(summary)) {
      console.log(`   ${getStatusIcon(status)} ${status}: ${count}`);
    }

    if (save) {
      saveStatusReport(results);
    }

    return results;
  };

  if (watch) {
    console.log('👀 Watch mode enabled - checking every 5 minutes...\n');
    
    const interval = setInterval(async () => {
      console.log(`\n🔄 Status check at ${new Date().toLocaleTimeString()}`);
      await checkAllStatus();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial check
    await checkAllStatus();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping monitor...');
      clearInterval(interval);
      process.exit(0);
    });

    console.log('\n⌨️  Press Ctrl+C to stop monitoring');

  } else {
    await checkAllStatus();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkStatus, PACKAGE_STATUS };
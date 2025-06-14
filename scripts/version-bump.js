#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Automated version bumping across all Parserator packages
 * Handles Chrome Extension, VS Code Extension, Python SDK, Node SDK, etc.
 */

const PACKAGES = [
  {
    name: 'Chrome Extension',
    path: 'chrome-extension/package.json',
    manifestPath: 'chrome-extension/manifest.json',
    versionField: 'version'
  },
  {
    name: 'VS Code Extension', 
    path: 'vscode-extension/package.json',
    versionField: 'version'
  },
  {
    name: 'Python SDK',
    path: 'python-sdk/pyproject.toml',
    versionField: 'version',
    isToml: true
  },
  {
    name: 'Node SDK',
    path: 'node-sdk/package.json',
    versionField: 'version'
  },
  {
    name: 'MCP Server',
    path: 'mcp-server/package.json', 
    versionField: 'version'
  },
  {
    name: 'Dashboard',
    path: 'dashboard/package.json',
    versionField: 'version'
  }
];

function getCurrentVersion(packageConfig) {
  const fullPath = path.join(process.cwd(), packageConfig.path);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${packageConfig.name}: File not found at ${packageConfig.path}`);
    return null;
  }

  if (packageConfig.isToml) {
    // Handle Python pyproject.toml
    const content = fs.readFileSync(fullPath, 'utf8');
    const versionMatch = content.match(/version = "([^"]+)"/);
    return versionMatch ? versionMatch[1] : null;
  } else {
    // Handle JSON files
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return content[packageConfig.versionField];
    } catch (err) {
      console.log(`❌ ${packageConfig.name}: Error reading JSON - ${err.message}`);
      return null;
    }
  }
}

function updateVersion(packageConfig, newVersion) {
  const fullPath = path.join(process.cwd(), packageConfig.path);
  
  if (packageConfig.isToml) {
    // Update Python pyproject.toml
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/version = "[^"]+"/, `version = "${newVersion}"`);
    fs.writeFileSync(fullPath, content);
  } else {
    // Update JSON files
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    content[packageConfig.versionField] = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
  }

  // Special handling for Chrome extension manifest
  if (packageConfig.manifestPath) {
    const manifestPath = path.join(process.cwd(), packageConfig.manifestPath);
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.version = newVersion;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    }
  }

  console.log(`✅ ${packageConfig.name}: Updated to v${newVersion}`);
}

function bumpVersion(version, type = 'patch') {
  const parts = version.replace(/[^\d.]/g, '').split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0] || 'patch';
  const targetVersion = args[1];

  console.log('🔄 Parserator Version Bump Tool\n');

  // Get current versions
  const currentVersions = new Map();
  for (const pkg of PACKAGES) {
    const version = getCurrentVersion(pkg);
    if (version) {
      currentVersions.set(pkg.name, version);
    }
  }

  if (currentVersions.size === 0) {
    console.log('❌ No packages found to update');
    process.exit(1);
  }

  console.log('📋 Current Versions:');
  for (const [name, version] of currentVersions) {
    console.log(`   ${name}: v${version}`);
  }
  console.log();

  // Determine new version
  let newVersion;
  if (targetVersion) {
    newVersion = targetVersion;
    console.log(`🎯 Target Version: v${newVersion}`);
  } else {
    // Use the highest current version as base
    const versions = Array.from(currentVersions.values());
    const baseVersion = versions.sort((a, b) => {
      const aParts = a.replace(/[^\d.]/g, '').split('.').map(Number);
      const bParts = b.replace(/[^\d.]/g, '').split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aDiff = (aParts[i] || 0) - (bParts[i] || 0);
        if (aDiff !== 0) return aDiff > 0 ? -1 : 1;
      }
      return 0;
    })[0];
    
    newVersion = bumpVersion(baseVersion, bumpType);
    console.log(`🔼 Bumping ${bumpType}: v${baseVersion} → v${newVersion}`);
  }
  console.log();

  // Update all packages
  for (const pkg of PACKAGES) {
    if (currentVersions.has(pkg.name)) {
      updateVersion(pkg, newVersion);
    }
  }

  console.log(`\n🎉 All packages updated to v${newVersion}!`);
  
  // Generate build commands
  console.log('\n📦 Next Steps:');
  console.log('   npm run build:all    # Rebuild all packages');
  console.log('   npm run package:all  # Create distribution packages');
  console.log(`   git add -A && git commit -m "chore: bump version to v${newVersion}"`);
  console.log(`   git tag v${newVersion} && git push origin v${newVersion}`);
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, getCurrentVersion, updateVersion };
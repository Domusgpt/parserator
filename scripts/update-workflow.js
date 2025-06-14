#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Parserator Update/Patch Workflow Manager
 * Handles updates to live extensions and packages
 */

const RELEASE_CHANNELS = {
  hotfix: {
    description: 'Critical bug fixes (patch version)',
    bumpType: 'patch',
    autoPublish: true,
    requiresApproval: false
  },
  minor: {
    description: 'Feature updates (minor version)',
    bumpType: 'minor',
    autoPublish: false,
    requiresApproval: true
  },
  major: {
    description: 'Breaking changes (major version)',
    bumpType: 'major',
    autoPublish: false,
    requiresApproval: true
  }
};

const PLATFORM_WORKFLOWS = {
  chrome: {
    name: 'Chrome Web Store',
    buildCommand: 'npm run build:chrome',
    packagePath: 'chrome-extension/parserator-chrome-extension-v*.zip',
    submitInstructions: [
      '1. Go to https://chrome.google.com/webstore/devconsole',
      '2. Find your extension in the dashboard',
      '3. Click "Edit" → "Upload updated package"',
      '4. Select the new .zip file',
      '5. Review changes and submit for review'
    ],
    reviewTime: '1-3 business days'
  },
  vscode: {
    name: 'VS Code Marketplace',
    buildCommand: 'npm run build:vscode',
    packagePath: 'vscode-extension/parserator-*.vsix',
    submitCommand: 'vsce publish',
    submitInstructions: [
      '1. cd vscode-extension',
      '2. vsce publish (requires access token)',
      '3. Or upload manually at https://marketplace.visualstudio.com/manage'
    ],
    reviewTime: '1-2 business days'
  },
  pypi: {
    name: 'Python Package Index',
    buildCommand: 'npm run build:python',
    packagePath: 'python-sdk/dist/*',
    submitCommand: 'twine upload dist/*',
    submitInstructions: [
      '1. cd python-sdk',
      '2. twine upload dist/* (requires PyPI credentials)',
      '3. Package is live immediately after upload'
    ],
    reviewTime: 'Immediate'
  },
  npm: {
    name: 'NPM Registry',
    buildCommand: 'npm run build:node',
    packagePath: 'node-sdk/dist/*',
    submitCommand: 'npm publish',
    submitInstructions: [
      '1. cd node-sdk',
      '2. npm publish (requires NPM access)',
      '3. Package is live immediately after publish'
    ],
    reviewTime: 'Immediate'
  },
  jetbrains: {
    name: 'JetBrains Marketplace',
    buildCommand: 'npm run build:jetbrains',
    packagePath: 'jetbrains-plugin/build/distributions/*.zip',
    submitInstructions: [
      '1. Go to https://plugins.jetbrains.com/',
      '2. Upload plugin ZIP file',
      '3. Fill in update notes',
      '4. Submit for review'
    ],
    reviewTime: '1-7 business days'
  }
};

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd()
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

function getCurrentVersions() {
  const versions = {};
  
  // Chrome Extension
  try {
    const manifest = JSON.parse(fs.readFileSync('chrome-extension/manifest.json', 'utf8'));
    versions.chrome = manifest.version;
  } catch (err) { versions.chrome = 'unknown'; }
  
  // VS Code Extension  
  try {
    const pkg = JSON.parse(fs.readFileSync('vscode-extension/package.json', 'utf8'));
    versions.vscode = pkg.version;
  } catch (err) { versions.vscode = 'unknown'; }
  
  // Python SDK
  try {
    const pyproject = fs.readFileSync('python-sdk/pyproject.toml', 'utf8');
    const match = pyproject.match(/version = "([^"]+)"/);
    versions.pypi = match ? match[1] : 'unknown';
  } catch (err) { versions.pypi = 'unknown'; }
  
  // Node SDK
  try {
    const pkg = JSON.parse(fs.readFileSync('node-sdk/package.json', 'utf8'));
    versions.npm = pkg.version;
  } catch (err) { versions.npm = 'unknown'; }
  
  return versions;
}

function createUpdatePlan(releaseType, platforms) {
  const releaseConfig = RELEASE_CHANNELS[releaseType];
  if (!releaseConfig) {
    throw new Error(`Invalid release type: ${releaseType}`);
  }
  
  const currentVersions = getCurrentVersions();
  const timestamp = new Date().toISOString();
  
  return {
    releaseType,
    description: releaseConfig.description,
    timestamp,
    currentVersions,
    platforms: platforms.map(platform => ({
      name: platform,
      config: PLATFORM_WORKFLOWS[platform],
      currentVersion: currentVersions[platform]
    })),
    steps: [
      'Version bump',
      'Build packages',
      'Run validation tests',
      'Create update documentation',
      'Submit to platforms',
      'Monitor approval status'
    ]
  };
}

function executeUpdatePlan(plan) {
  console.log(`🚀 Executing ${plan.releaseType} update plan...\n`);
  
  // Step 1: Version bump
  console.log('📈 Step 1: Version bumping...');
  const versionResult = runCommand(`node scripts/version-bump.js ${RELEASE_CHANNELS[plan.releaseType].bumpType}`);
  if (!versionResult.success) {
    throw new Error(`Version bump failed: ${versionResult.error}`);
  }
  
  // Step 2: Build packages
  console.log('\n🔨 Step 2: Building packages...');
  for (const platform of plan.platforms) {
    console.log(`   Building ${platform.name}...`);
    const buildResult = runCommand(platform.config.buildCommand);
    if (!buildResult.success) {
      console.log(`   ❌ Build failed: ${buildResult.error}`);
    } else {
      console.log(`   ✅ Build successful`);
    }
  }
  
  // Step 3: Validation
  console.log('\n🧪 Step 3: Running validation tests...');
  const validationResult = runCommand('node scripts/post-publish-validation.js --skip-packages');
  if (!validationResult.success) {
    console.log('   ⚠️ Some validation tests failed - review before publishing');
  }
  
  // Step 4: Create documentation
  console.log('\n📝 Step 4: Creating update documentation...');
  const updateDoc = generateUpdateDocumentation(plan);
  fs.writeFileSync(`UPDATE-${plan.timestamp.slice(0, 10)}.md`, updateDoc);
  console.log('   ✅ Update documentation created');
  
  // Step 5: Platform submission instructions
  console.log('\n📤 Step 5: Platform submission instructions...');
  for (const platform of plan.platforms) {
    console.log(`\n   ${platform.config.name}:`);
    platform.config.submitInstructions.forEach(instruction => {
      console.log(`      ${instruction}`);
    });
    console.log(`      Review time: ${platform.config.reviewTime}`);
  }
  
  console.log('\n✅ Update plan executed successfully!');
  console.log('📄 Review UPDATE-*.md file for complete instructions');
}

function generateUpdateDocumentation(plan) {
  const newVersions = getCurrentVersions();
  
  return `# Parserator ${plan.releaseType.toUpperCase()} Update - ${plan.timestamp.slice(0, 10)}

## Update Summary
**Type:** ${plan.description}
**Date:** ${new Date(plan.timestamp).toLocaleDateString()}

## Version Changes
${plan.platforms.map(p => `- **${p.config.name}:** v${p.currentVersion} → v${newVersions[p.name]}`).join('\n')}

## Platforms to Update

${plan.platforms.map(platform => `
### ${platform.config.name}
**Package:** \`${platform.config.packagePath}\`
**Review Time:** ${platform.config.reviewTime}

**Instructions:**
${platform.config.submitInstructions.map(inst => `1. ${inst}`).join('\n')}

${platform.config.submitCommand ? `**CLI Command:**\n\`\`\`bash\n${platform.config.submitCommand}\n\`\`\`` : ''}
`).join('\n')}

## Post-Submission Checklist
- [ ] All platforms submitted
- [ ] Monitor approval status with: \`npm run publish:monitor:watch\`
- [ ] Validate published packages with: \`npm run publish:validate\`
- [ ] Update documentation and announcements
- [ ] Monitor user feedback and issues

## Rollback Plan
If issues are discovered:
1. Identify affected platforms
2. Prepare hotfix with version bump
3. Follow same submission process
4. Communicate issues to users

Generated by Parserator Update Workflow System
`;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
🔄 Parserator Update Workflow Manager

Usage:
  node scripts/update-workflow.js plan <release-type> [platforms...]
  node scripts/update-workflow.js execute <release-type> [platforms...]
  node scripts/update-workflow.js status
  
Release Types:
  hotfix  - Critical bug fixes (patch version)
  minor   - Feature updates (minor version)  
  major   - Breaking changes (major version)
  
Platforms:
  chrome, vscode, pypi, npm, jetbrains
  
Examples:
  # Plan a hotfix for Chrome and VS Code
  node scripts/update-workflow.js plan hotfix chrome vscode
  
  # Execute a minor update for all platforms
  node scripts/update-workflow.js execute minor chrome vscode pypi npm jetbrains
  
  # Check current status
  node scripts/update-workflow.js status
`);
    return;
  }

  switch (command) {
    case 'plan': {
      const releaseType = args[1];
      const platforms = args.slice(2);
      
      if (!releaseType || platforms.length === 0) {
        console.log('❌ Please specify release type and platforms');
        return;
      }
      
      try {
        const plan = createUpdatePlan(releaseType, platforms);
        console.log(JSON.stringify(plan, null, 2));
      } catch (error) {
        console.log(`❌ Planning failed: ${error.message}`);
      }
      break;
    }
    
    case 'execute': {
      const releaseType = args[1];
      const platforms = args.slice(2);
      
      if (!releaseType || platforms.length === 0) {
        console.log('❌ Please specify release type and platforms');
        return;
      }
      
      try {
        const plan = createUpdatePlan(releaseType, platforms);
        executeUpdatePlan(plan);
      } catch (error) {
        console.log(`❌ Execution failed: ${error.message}`);
      }
      break;
    }
    
    case 'status': {
      const versions = getCurrentVersions();
      console.log('📊 Current Platform Versions:\n');
      for (const [platform, version] of Object.entries(versions)) {
        console.log(`   ${PLATFORM_WORKFLOWS[platform]?.name || platform}: v${version}`);
      }
      break;
    }
    
    default:
      console.log(`❌ Unknown command: ${command}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createUpdatePlan, executeUpdatePlan, getCurrentVersions };
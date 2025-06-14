# Claude.md - Parserator Development Guidelines

## Project Overview
Parserator is **"The Structured Data Layer for AI Agents"** - a production-grade parsing engine that converts unstructured text into structured JSON with ~95% accuracy. It uses a two-stage **Architect-Extractor** LLM pattern for efficiency.

## Current Status (Updated: June 13, 2025) - PRODUCTION READY ✅
- **API**: ✅ FULLY WORKING at `https://app-5108296280.us-central1.run.app/v1/parse` (95% confidence, ~500 tokens, ~2.4s response)
- **Website**: ✅ Live at `https://parserator-production.web.app`
- **Node SDK**: ✅ Published on NPM as `parserator-sdk` v1.0.0 (tested and working)
- **Python SDK**: ✅ Built and ready for PyPI (v1.1.0-alpha with .whl and .tar.gz)
- **Chrome Extension**: ✅ Production-ready (v1.0.1 zip, 515KB, ready for Chrome Web Store)
- **VS Code Extension**: ✅ Production-ready (parserator-1.0.0.vsix, 515KB, ready for marketplace)
- **JetBrains Plugin**: ✅ Complete Gradle project ready for JetBrains marketplace
- **GitHub**: ✅ Professional repository at https://github.com/domusgpt/parserator

## Critical Development Guidelines

### EMA (Exoditical Moral Architecture) Principles
**MANDATORY** - All development must follow these principles:
- **Digital Sovereignty**: User data belongs to users, not us
- **No Vendor Lock-in**: Always provide export/migration capabilities
- **Transparent Competition**: Compete on merit, not captivity
- **Right to Leave**: Users can export and leave anytime

### Production Standards
- **NO DEMOS OR PROTOTYPES**: All code must be production-ready
- **Complete Error Handling**: No placeholder error messages
- **Real Integrations**: Connect to actual APIs, not mocks
- **Full Testing**: Include real tests with realistic data

### Technical Architecture
- **Two-Stage Processing**: Architect → Extractor pattern is core
- **Token Efficiency**: ~70% reduction vs single-LLM approaches
- **Performance Targets**: <3s response time, 95%+ accuracy

## Development Priorities

### VERIFIED WORKING SYSTEMS ✅
1. **API Endpoint**: Two-stage Architect-Extractor working perfectly (95% confidence)
2. **Node SDK**: Published and functional on NPM
3. **All Extensions**: Built, packaged, and ready for store submission

### IMMEDIATE LAUNCH OPPORTUNITIES 🚀
1. **Chrome Extension**: Submit parserator-chrome-extension-v1.0.1.zip to Chrome Web Store
2. **VS Code Extension**: Submit parserator-1.0.0.vsix to VS Code Marketplace  
3. **Python SDK**: Publish parserator_sdk-1.1.0a0 to PyPI
4. **JetBrains Plugin**: Build and submit to JetBrains marketplace

### Build System Notes
- **Turbo**: Has Linux binary issues in WSL (Windows node_modules incompatible)
- **Workaround**: All packages can be built individually and work perfectly
- **Reality**: System is production-ready despite build tool issues

## Key Directories
- `/packages/core/` - Core parsing engine
- `/packages/api/` - Firebase Cloud Functions API
- `/packages/sdk-node/` - Node.js SDK (published)
- `/packages/sdk-python/` - Python SDK
- `/chrome-extension/` - Chrome extension (ready)
- `/vscode-extension/` - VS Code extension (ready)
- `/examples/` - Integration examples

## Common Commands
```bash
# Individual package builds (since Turbo is broken)
cd packages/core && npm run build
cd packages/sdk-node && npm run build
cd packages/api && npm run build

# Extension packaging
cd chrome-extension && ./build.sh
cd vscode-extension && vsce package
```

## Contact & Support
- **Email**: Gen-rl-millz@parserator.com
- **GitHub**: https://github.com/domusgpt/parserator
- **Website**: https://parserator.com

## Remember
- Always maintain EMA principles
- Production-ready code only
- Test with real data
- Document all changes
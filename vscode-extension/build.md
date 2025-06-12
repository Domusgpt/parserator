# Parserator VS Code Extension - Build Guide

This guide explains how to build, test, and package the Parserator VS Code extension.

## Prerequisites

- Node.js 18+ and npm 9+
- VS Code 1.74.0 or later
- TypeScript 4.9+

## Building the Extension

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile TypeScript

```bash
npm run compile
```

### 3. Watch Mode (for development)

```bash
npm run watch
```

## Running Tests

### Run all tests

```bash
npm test
```

### Lint the code

```bash
npm run lint
```

## Packaging for Distribution

### 1. Install VSCE (if not already installed)

```bash
npm install -g @vscode/vsce
```

### 2. Package the extension

```bash
npm run package
```

This creates a `.vsix` file that can be installed in VS Code.

### 3. Install the packaged extension

```bash
code --install-extension parserator-1.0.0.vsix
```

## Development Setup

### 1. Open in VS Code

```bash
code .
```

### 2. Run Extension (F5)

Press F5 to open a new Extension Development Host window with the extension loaded.

### 3. Test the Extension

1. Configure your Parserator API key in settings
2. Open any text file
3. Select some text
4. Right-click and choose "Parse Selection"
5. Choose a schema and see the results

## Project Structure

```
vscode-extension/
├── src/                          # TypeScript source code
│   ├── extension.ts             # Main extension entry point
│   ├── services/                # Core services
│   │   └── parseratorService.ts # API client
│   ├── providers/               # VS Code tree data providers
│   │   └── schemaProvider.ts    # Schema tree view
│   ├── managers/                # Business logic managers
│   │   ├── schemaManager.ts     # Schema CRUD operations
│   │   ├── resultsManager.ts    # Results display
│   │   └── notificationManager.ts # User notifications
│   ├── utils/                   # Utility functions
│   │   ├── validation.ts        # Input validation
│   │   └── formatters.ts        # Display formatters
│   └── test/                    # Test files
├── snippets/                    # Code snippets
├── syntaxes/                    # Language definitions
├── package.json                 # Extension manifest
├── tsconfig.json               # TypeScript config
└── README.md                   # Documentation
```

## Configuration

The extension uses these VS Code settings:

- `parserator.apiKey` - Your Parserator API key (required)
- `parserator.baseUrl` - API base URL (default: https://api.parserator.com)
- `parserator.timeout` - Request timeout in ms (default: 30000)
- `parserator.autoOpenResults` - Auto-open results tab (default: true)
- `parserator.showNotifications` - Show success/error messages (default: true)

## Features Implemented

✅ **Core Functionality**
- Parse selected text using Parserator API
- Schema management (CRUD operations)
- Results display in new editor tabs
- Real-time progress feedback

✅ **User Interface**
- Side panel for schema management
- Context menu integration
- Command palette commands
- Settings configuration

✅ **Schema System**
- Built-in schema templates
- Custom schema creation
- Import/export functionality
- Validation and error handling

✅ **Developer Experience**
- TypeScript implementation
- Comprehensive error handling
- Syntax highlighting for schemas
- Code snippets for quick development
- Full test suite

✅ **Production Ready**
- Proper API key validation
- Network error handling
- User-friendly error messages
- Configurable timeouts
- Memory-efficient operations

## Deployment

### To VS Code Marketplace

1. Get a Personal Access Token from Azure DevOps
2. Create a publisher account
3. Publish using VSCE:

```bash
vsce publish
```

### Manual Installation

1. Package the extension: `npm run package`
2. Install the .vsix file: `code --install-extension parserator-1.0.0.vsix`

## Troubleshooting

### Common Issues

1. **Compilation errors**: Run `npm install` to ensure all dependencies are installed
2. **API key issues**: Verify the key format (pk_live_xxx or pk_test_xxx)
3. **Network errors**: Check internet connection and API endpoint
4. **Schema validation**: Ensure JSON is properly formatted

### Debug Mode

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Run Extension"
4. Press F5 to launch debug session

## Support

For issues and questions:
- Check the extension's README.md
- Review the API documentation
- Contact support@parserator.com
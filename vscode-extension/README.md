# Parserator VS Code Extension

Transform unstructured text into structured JSON using AI-powered parsing, directly within VS Code.

## Features

- **Parse Selection**: Select any text in VS Code and transform it into structured JSON using customizable schemas
- **Schema Management**: Create, edit, and manage parsing schemas through an intuitive side panel
- **Built-in Templates**: Pre-configured schemas for common use cases (emails, invoices, resumes, etc.)
- **Syntax Highlighting**: Custom syntax highlighting for Parserator schema files
- **Code Snippets**: Intelligent snippets for quickly creating new schemas
- **Real-time Results**: View parsing results in a new editor tab with detailed metadata
- **API Integration**: Direct integration with Parserator's production API

## Getting Started

### 1. Install the Extension

Install the Parserator extension from the VS Code marketplace or by searching for "Parserator" in the Extensions view.

### 2. Configure Your API Key

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Parserator"
3. Enter your Parserator API key in the `parserator.apiKey` setting

Get your API key from [https://app.parserator.com](https://app.parserator.com)

### 3. Start Parsing

1. Select any text in a VS Code editor
2. Right-click and choose "Parse Selection" or use `Ctrl+Shift+P` → "Parserator: Parse Selection"
3. Choose a schema or create a new one
4. View your structured results in the new editor tab

## Usage

### Parsing Text

1. **Select text** you want to parse in any editor
2. **Right-click** and select "Parse Selection" from the context menu
3. **Choose a schema** from the dropdown list
4. **View results** in the new JSON editor tab

### Managing Schemas

#### Using the Schema Panel

1. Open the Explorer view in VS Code
2. Find the "Parserator Schemas" section
3. Use the toolbar buttons to:
   - Add new schemas
   - Refresh the list
   - Edit existing schemas
   - Delete schemas

#### Creating Custom Schemas

Use the built-in snippets to quickly create schemas:

1. Create a new JSON file
2. Type `parserator-schema` and press Tab
3. Fill in your schema details
4. Save and add to your schema collection

### Built-in Schema Templates

The extension includes pre-configured schemas for:

- **Email Contact Extractor**: Extract contact info from emails
- **Invoice Data Extractor**: Parse invoice and receipt data
- **Resume Parser**: Extract structured data from resumes
- **Meeting Notes Parser**: Parse meeting notes and action items
- **Product Review Analyzer**: Analyze product reviews for insights

### Supported Field Types

Parserator supports these field types in your schemas:

- `string` - Text data
- `number` - Numeric values
- `boolean` - True/false values
- `email` - Email addresses
- `phone` - Phone numbers
- `date` - Date values (YYYY-MM-DD)
- `datetime` - Date with time
- `currency` - Monetary amounts
- `url` - Web addresses
- `string_array` - Array of strings

## Example Schema

```json
{
  "name": "Email Contact Extractor",
  "description": "Extract contact information from emails",
  "schema": {
    "sender_name": "string",
    "sender_email": "email",
    "sender_company": "string",
    "phone_numbers": "string_array",
    "meeting_time": "datetime",
    "action_items": "string_array"
  },
  "instructions": "Focus on extracting actionable business information"
}
```

## Commands

| Command | Description |
|---------|-------------|
| `Parserator: Parse Selection` | Parse selected text using a chosen schema |
| `Parserator: Open Schema Panel` | Open the schema management panel |
| `Parserator: Test API Connection` | Test your API connection |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `parserator.apiKey` | Your Parserator API key | "" |
| `parserator.baseUrl` | API base URL | "https://api.parserator.com" |
| `parserator.timeout` | Request timeout (ms) | 30000 |
| `parserator.autoOpenResults` | Auto-open results in new tab | true |
| `parserator.showNotifications` | Show success/error notifications | true |

## Keyboard Shortcuts

- `Ctrl+Shift+P` → "Parserator: Parse Selection" - Parse selected text
- `Ctrl+Shift+P` → "Parserator: Test Connection" - Test API connection

## Troubleshooting

### API Key Issues

If you're having trouble with API authentication:

1. Verify your API key is correctly set in settings
2. Ensure your API key starts with `pk_live_` or `pk_test_`
3. Test your connection using "Parserator: Test API Connection"

### Parsing Errors

If parsing fails:

1. Check that your selected text isn't empty
2. Verify your schema is valid JSON
3. Ensure your API key has sufficient quota
4. Check the VS Code Developer Console for detailed error messages

### Schema Issues

If schemas aren't working as expected:

1. Validate your schema JSON format
2. Ensure all required fields are present (`name` and `schema`)
3. Check that field types are supported
4. Test with simpler schemas first

## Support

- **Documentation**: [https://docs.parserator.com](https://docs.parserator.com)
- **API Reference**: [https://api.parserator.com/docs](https://api.parserator.com/docs)
- **Issues**: [GitHub Issues](https://github.com/domusgpt/parserator/issues)
- **Email**: support@parserator.com

## License

This extension is proprietary software. All rights reserved.

---

**Enjoy transforming your unstructured data with Parserator!** 🚀
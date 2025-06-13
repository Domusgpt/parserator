# MCP Server Integration Guide

## Quick Start

```bash
# Install globally
npm install -g parserator-mcp-server

# Start server
parserator-mcp YOUR_API_KEY
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "parserator": {
      "command": "parserator-mcp",
      "args": ["pk_live_your_api_key"]
    }
  }
}
```

## Example Usage

```
User: Parse this email for contact info:
"Hi, I'm John Smith from Acme Corp. Call me at 555-123-4567 or email john@acme.com"

Claude: I'll parse that for contact information.

Result: {
  "name": "John Smith",
  "company": "Acme Corp", 
  "phone": "555-123-4567",
  "email": "john@acme.com"
}
```

## Available Tools

- `parserator_extract` - Extract structured data with custom schema
- `parserator_template` - Use saved parsing templates
- `parserator_analyze` - Analyze input and suggest optimal schema
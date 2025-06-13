# 🤖 Parserator MCP Server

<p align="center">
  <img src="parserator-logo.png" alt="Parserator Logo" width="120" height="120">
</p>

**Intelligent data parsing for AI agents via Model Context Protocol**

Transform any unstructured data into structured JSON using Parserator's revolutionary **Architect-Extractor pattern** - now available as a standardized MCP tool that any AI agent can use.

[![npm version](https://badge.fury.io/js/parserator-mcp-server.svg)](https://www.npmjs.com/package/parserator-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 **What is this?**

The Parserator MCP Server exposes [Parserator's](https://parserator.com) intelligent parsing capabilities through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), making it available to any AI agent that supports MCP.

### **Why MCP + Parserator?**

- **Universal Compatibility**: Works with Claude Desktop, LangChain, CrewAI, AutoGPT, and any MCP-compatible agent
- **Zero Vendor Lock-in**: MCP is an open standard - switch agents freely while keeping your parsing tools
- **Production Ready**: Built on Parserator's proven Architect-Extractor pattern with 95%+ accuracy
- **Token Efficient**: 70% fewer tokens than naive LLM prompting approaches

## 🏗️ **The Architect-Extractor Advantage**

Unlike simple "prompt an LLM to output JSON" approaches, Parserator uses a sophisticated two-stage process:

1. **🏛️ The Architect**: Plans the parsing strategy using a small data sample
2. **⚡ The Extractor**: Executes the plan on full data with surgical precision

**Result**: Higher accuracy, lower token costs, more reliable outputs.

## 📦 **Installation & Setup**

### **Quick Start**

```bash
# Install globally
npm install -g parserator-mcp-server

# Run with your API key
parserator-mcp-server pk_live_your_api_key_here
```

### **Get Your API Key**

1. Visit [parserator.com](https://parserator.com)
2. Sign up for free account
3. Generate API key from dashboard
4. Start with 1,000 free parses per month

### **Claude Desktop Integration**

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "parserator": {
      "command": "npx",
      "args": ["parserator-mcp-server", "pk_live_your_api_key"],
      "description": "Intelligent data parsing for AI agents"
    }
  }
}
```

### **Other Agent Frameworks**

The MCP server works with any MCP-compatible system:

- **LangChain**: Use MCP tool integration
- **CrewAI**: Add as MCP skill
- **AutoGPT**: Plugin via MCP adapter
- **Custom Agents**: Standard MCP protocol

## 🛠️ **Available Tools**

### **`parse_data`** - Main Parsing Tool

Transform unstructured data into structured JSON:

```javascript
// Example: Email processing
{
  "inputData": "From: john@company.com\nSubject: Q4 Report Due\nHi team, please finish the quarterly report by Dec 15th.",
  "outputSchema": {
    "sender": "string",
    "subject": "string", 
    "deadline": "string",
    "priority": "string",
    "tasks": "string_array"
  },
  "instructions": "Extract actionable information"
}

// Result:
{
  "success": true,
  "parsedData": {
    "sender": "john@company.com",
    "subject": "Q4 Report Due",
    "deadline": "December 15th",
    "priority": "normal",
    "tasks": ["finish quarterly report"]
  },
  "metadata": {
    "confidence": 0.96,
    "tokensUsed": 245,
    "processingTime": 850
  }
}
```

### **`suggest_schema`** - AI-Powered Schema Generation

Let AI suggest the optimal structure for your data:

```javascript
{
  "sampleData": "John Smith, Senior Engineer, john@tech.com, (555) 123-4567"
}

// Result:
{
  "suggestedSchema": {
    "name": "string",
    "title": "string", 
    "email": "string",
    "phone": "string"
  },
  "confidence": 0.91
}
```

### **`validate_schema`** - Data Validation

Ensure parsed data matches expected structure:

```javascript
{
  "data": {"name": "John", "email": "john@email.com"},
  "schema": {"name": "string", "email": "string", "phone": "string"}
}

// Result:
{
  "valid": false,
  "errors": ["Missing required field: phone"],
  "suggestions": ["Add phone field or mark as optional"]
}
```

### **`test_connection`** - Health Check

Verify API connectivity and account status:

```javascript
// No parameters needed

// Result:
{
  "connection": "healthy",
  "latency": "245ms",
  "apiEndpoint": "https://app-5108296280.us-central1.run.app"
}
```

## 📊 **Available Resources**

### **`parserator://usage`** - API Usage Stats

```json
{
  "requestsThisMonth": 1250,
  "tokensUsedThisMonth": 125000,
  "quotaRemaining": 875,
  "billingPeriod": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

### **`parserator://templates`** - Pre-built Patterns

```json
[
  {
    "id": "email-processor",
    "name": "Email Processor", 
    "description": "Extract structured data from emails",
    "schema": {
      "sender": "string",
      "subject": "string",
      "tasks": "string_array",
      "priority": "string"
    }
  }
]
```

### **`parserator://examples`** - Usage Examples

Complete examples for common use cases with expected inputs/outputs.

## 🎯 **Common Use Cases**

### **📧 Email Processing Agents**

```javascript
// Parse emails to extract actionable items
const emailResult = await callTool('parserator', 'parse_data', {
  inputData: rawEmailContent,
  outputSchema: {
    sender: 'string',
    recipients: 'string_array', 
    tasks: 'string_array',
    dates: 'string_array',
    priority: 'string',
    summary: 'string'
  }
});
```

### **📄 Document Analysis Agents**

```javascript
// Extract key information from documents
const docResult = await callTool('parserator', 'parse_data', {
  inputData: documentText,
  outputSchema: {
    title: 'string',
    author: 'string',
    keyPoints: 'string_array',
    entities: 'array',
    sentiment: 'string'
  }
});
```

### **🧾 Invoice Processing Agents**

```javascript
// Parse invoices for business automation
const invoiceResult = await callTool('parserator', 'parse_data', {
  inputData: invoiceText,
  outputSchema: {
    vendor: 'string',
    amount: 'number',
    date: 'string',
    items: 'array',
    invoiceNumber: 'string'
  }
});
```

### **🕷️ Web Scraping Agents**

```javascript
// Normalize data from different website structures
const webResult = await callTool('parserator', 'parse_data', {
  inputData: scrapedContent,
  outputSchema: {
    title: 'string',
    price: 'number',
    description: 'string',
    features: 'string_array',
    availability: 'boolean'
  }
});
```

## 🔧 **Advanced Configuration**

### **Environment Variables**

```bash
# Optional: Custom API endpoint
PARSERATOR_BASE_URL=https://your-custom-endpoint.com

# Optional: Request timeout (default: 30000ms)
PARSERATOR_TIMEOUT=60000

# Optional: Enable debug logging
PARSERATOR_DEBUG=true
```

### **Programmatic Usage**

```typescript
import { ParseratorMCPServer } from 'parserator-mcp-server';

const server = new ParseratorMCPServer('pk_live_your_api_key');
await server.start();
```

## 🚀 **Performance & Reliability**

### **Built for Production**

- **High Accuracy**: 95%+ success rate on structured data extraction
- **Fast Response**: <3 second average processing time
- **Token Efficient**: 70% fewer tokens than naive approaches
- **Reliable**: 99.9% uptime with automatic retries

### **Error Handling**

- Graceful degradation with fallback methods
- Detailed error messages with suggestions
- Automatic retry logic for transient failures
- Comprehensive logging and debugging support

## 🌟 **Why Choose Parserator MCP?**

### **vs. Manual Prompting**
❌ **Manual**: "Extract this data as JSON" (unreliable, high tokens)  
✅ **Parserator**: Architect-Extractor pattern (reliable, efficient)

### **vs. Rigid Libraries**  
❌ **Libraries**: Fixed schemas, brittle parsing  
✅ **Parserator**: Flexible schemas, intelligent adaptation

### **vs. Vendor Lock-in**
❌ **Proprietary**: Locked to specific platforms  
✅ **MCP**: Universal standard, freedom to move

## 🤝 **Contributing & Community**

- **GitHub**: [parserator/mcp-server](https://github.com/parserator/mcp-server)
- **Issues**: [Report bugs](https://github.com/parserator/mcp-server/issues)
- **Discord**: [Join the community](https://discord.gg/parserator)
- **Docs**: [Full documentation](https://docs.parserator.com/mcp)

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🏢 **Enterprise & Support**

- **Enterprise Plans**: Custom SLAs, on-premise deployment
- **Priority Support**: Dedicated support channels
- **Custom Integration**: Help with complex parsing needs
- **Training**: Team workshops and best practices

Contact: [enterprise@parserator.com](mailto:enterprise@parserator.com)

---

**Built with ❤️ by the Parserator team**  
*Making AI agents smarter, one parse at a time*

[🌐 parserator.com](https://parserator.com) | [📚 Documentation](https://docs.parserator.com) | [🐦 Twitter](https://twitter.com/parserator)
# Parserator Documentation

**The Structured Data Layer for AI Agents**

## Quick Start

### 1. API Usage (Universal)
```bash
curl -X POST https://app-5108296280.us-central1.run.app/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "John Doe, Software Engineer, john@example.com", 
    "schema": {"name": "string", "role": "string", "email": "string"}
  }'
```

### 2. Node.js SDK
```bash
npm install parserator-sdk
```

```javascript
const { Parserator } = require('parserator-sdk');

const parser = new Parserator();
const result = await parser.parse(
  "Contact: Sarah at sarah@tech.com",
  { name: "string", email: "string" }
);
```

### 3. Python SDK
```bash
pip install parserator-sdk
```

```python
from parserator import Parserator

parser = Parserator()
result = parser.parse(
  "Order #12345 for $299.99",
  {"order_id": "string", "amount": "number"}
)
```

### 4. MCP Server (Universal Agent Compatibility)
```bash
npm install -g parserator-mcp-server
```

Works with Claude Desktop, AutoGPT, LangChain, CrewAI, and any MCP-compatible agent.

## Browser Extensions

### Chrome Extension
- **Download**: `chrome-extension/parserator-chrome-extension-v1.0.2.zip`
- **Install**: Chrome Web Store (submit zip file)
- **Features**: Parse any text on any webpage, export to multiple formats

### VS Code Extension  
- **Download**: `vscode-extension/parserator-1.0.0.vsix`
- **Install**: VS Code Marketplace (submit vsix file)
- **Features**: Parse code comments, logs, data files directly in editor

### JetBrains Plugin
- **Source**: `jetbrains-plugin/` (complete Kotlin implementation)
- **Install**: JetBrains Marketplace (manual build required)
- **Features**: Tool window, schema management, bulk operations

## Agent Framework Integration

### Google ADK
```python
@agent.tool
def parse_user_intent(text: str) -> UserIntent:
    return parserator.parse(text, UserIntent)
```

### LangChain
```python
from parserator import ParseratorTool
tools = [ParseratorTool()]
agent = create_react_agent(llm, tools, prompt)
```

### AutoGPT/CrewAI
Direct REST API integration with OpenAPI specification.

## Core Features

### Two-Stage Processing
1. **Architect**: Analyzes input and optimizes schema
2. **Extractor**: Performs extraction with refined prompts
3. **Result**: 70% token reduction, 95% accuracy

### Performance
- **Speed**: 2.6 seconds average response time
- **Accuracy**: 95% across all data types
- **Cost**: $0.000075 per request
- **Scalability**: Auto-scaling Firebase infrastructure

### EMA Compliance
- **Data Export**: Complete data portability
- **No Lock-in**: Works with any agent framework
- **Open Standards**: REST API, OpenAPI, JSON schemas
- **User Sovereignty**: Your data belongs to you

## Data Types Supported

- **Structured**: JSON, XML, CSV, TSV
- **Semi-structured**: Emails, logs, documents
- **Unstructured**: Natural language, OCR text
- **Specialized**: Invoices, contacts, events, products

## Schema Examples

### Contact Information
```json
{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "company": "string",
  "title": "string"
}
```

### E-commerce Order
```json
{
  "order_id": "string",
  "customer": "string",
  "items": "array",
  "total": "number", 
  "status": "string"
}
```

### Customer Support Ticket
```json
{
  "issue_type": "string",
  "priority": "string",
  "sentiment": "string",
  "product": "string",
  "description": "string"
}
```

## Error Handling

### Common Responses
- **200**: Success with parsed data
- **400**: Invalid schema or text
- **429**: Rate limit exceeded
- **500**: Server error

### Error Format
```json
{
  "error": "Schema validation failed",
  "code": "INVALID_SCHEMA",
  "suggestions": ["Use 'string' instead of 'text'"],
  "request_id": "req_123456789"
}
```

## Rate Limits

- **Free Tier**: 100 requests/hour
- **Standard**: 1,000 requests/hour  
- **Pro**: 10,000 requests/hour
- **Enterprise**: Custom limits

## Security

- **HTTPS**: All API communication encrypted
- **API Keys**: Secure authentication
- **Data Privacy**: No data stored longer than processing time
- **GDPR Compliant**: Full data deletion on request

## Support

- **Documentation**: https://parserator.com/docs
- **GitHub**: https://github.com/domusgpt/parserator
- **Issues**: https://github.com/domusgpt/parserator/issues
- **Email**: support@parserator.com
- **Discord**: https://discord.gg/parserator

## Deployment Options

### Cloud (Recommended)
Use the hosted API at `https://app-5108296280.us-central1.run.app`

### Self-Hosted
Deploy the Firebase functions to your own project:
```bash
cd api/
firebase deploy --only functions
```

### Docker
```bash
docker run -p 3000:3000 parserator/api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure EMA compliance
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Exoditical Moral Architecture

Parserator follows EMA principles:
- **Your data, your choice**
- **No vendor lock-in**
- **Transparent competition**
- **Right to leave**

We compete on merit, not captivity.
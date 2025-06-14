# Parserator MCP Server Integration

## Installation

```bash
npm install -g parserator-mcp-server
```

## Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "parserator": {
      "command": "parserator-mcp-server",
      "args": ["--port", "3000"],
      "env": {
        "PARSERATOR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Usage Examples

### 1. Basic Data Parsing

```typescript
// Any MCP-compatible agent can use:
const result = await mcp.call("parserator/parse", {
  text: "John Doe, Software Engineer, john@example.com, (555) 123-4567",
  schema: {
    name: "string",
    title: "string", 
    email: "string",
    phone: "string"
  }
});

console.log(result);
// Output: {
//   name: "John Doe",
//   title: "Software Engineer", 
//   email: "john@example.com",
//   phone: "(555) 123-4567"
// }
```

### 2. Customer Service Agent

```typescript
const customerIssue = await mcp.call("parserator/parse", {
  text: "I'm frustrated with order #12345. Late delivery, damaged item. Need refund ASAP!",
  schema: {
    issue_type: "string",
    order_id: "string",
    problems: "array",
    sentiment: "string",
    priority: "string"
  }
});

// Use parsed data to route to appropriate handler
if (customerIssue.priority === "high") {
  await escalateToManager(customerIssue);
}
```

### 3. Document Processing Agent

```typescript
const invoice = await mcp.call("parserator/parse", {
  text: extractedInvoiceText,
  schema: {
    invoice_number: "string",
    vendor: "string",
    amount: "number",
    due_date: "string",
    line_items: "array"
  }
});

// Process for accounting system
await accountingSystem.createInvoice(invoice);
```

## Compatible Agents

- **Claude Desktop**: Native MCP support
- **ChatGPT with MCP**: Via plugins
- **AutoGPT**: MCP adapter
- **LangChain**: MCP integration
- **CrewAI**: MCP tools
- **Any MCP-compatible agent**

## Advanced Features

### Bulk Processing
```typescript
const results = await mcp.call("parserator/bulk-parse", {
  texts: [text1, text2, text3],
  schema: commonSchema
});
```

### Custom Schemas
```typescript
const schema = await mcp.call("parserator/create-schema", {
  name: "customer-feedback",
  template: "ecommerce"
});
```

### Export Options
```typescript
await mcp.call("parserator/export", {
  format: "csv",
  data: parsedResults
});
```

## Error Handling

```typescript
try {
  const result = await mcp.call("parserator/parse", params);
} catch (error) {
  if (error.code === "SCHEMA_VALIDATION_FAILED") {
    console.log("Schema needs adjustment:", error.suggestions);
  }
}
```

## Performance

- **Response Time**: < 3 seconds average
- **Accuracy**: 95% confidence across data types
- **Cost**: $0.000075 per request
- **Rate Limits**: 1000 requests/minute (standard plan)

## Support

- **Documentation**: https://parserator.com/docs
- **GitHub**: https://github.com/domusgpt/parserator
- **Issues**: https://github.com/domusgpt/parserator/issues
- **Email**: support@parserator.com
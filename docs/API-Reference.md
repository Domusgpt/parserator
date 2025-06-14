# Parserator API Reference

## Base URL
```
https://app-5108296280.us-central1.run.app/v1
```

## Authentication
Optional Bearer token authentication:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY"
```

## Core Endpoint

### POST /parse
Parse unstructured text into structured JSON data.

**Request Body:**
```json
{
  "text": "string (required) - The text to parse",
  "schema": "object (required) - JSON schema defining output structure", 
  "context": "string (optional) - Additional context for parsing"
}
```

**Response:**
```json
{
  "success": true,
  "data": "object - Parsed data matching schema",
  "metadata": {
    "confidence": "number - Confidence score (0-1)",
    "processing_time": "number - Time in milliseconds",
    "tokens_used": "number - Total tokens consumed"
  },
  "request_id": "string - Unique request identifier"
}
```

## Schema Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text value | `"John Doe"` |
| `number` | Numeric value | `42` or `3.14` |
| `boolean` | True/false | `true` |
| `array` | List of items | `["item1", "item2"]` |
| `object` | Nested structure | `{"key": "value"}` |

## Examples

### Contact Parsing
```bash
curl -X POST https://app-5108296280.us-central1.run.app/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sarah Johnson, Senior Developer at Tech Corp, sarah.j@techcorp.com, +1-555-0123",
    "schema": {
      "name": "string",
      "title": "string",
      "company": "string", 
      "email": "string",
      "phone": "string"
    }
  }'
```

### Invoice Processing
```bash
curl -X POST https://app-5108296280.us-central1.run.app/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "INVOICE #INV-2024-001\nBill To: Acme Corp\nDate: 2024-06-14\nSoftware License: $1,200.00\nTotal: $1,200.00",
    "schema": {
      "invoice_number": "string",
      "client": "string",
      "date": "string",
      "items": "array",
      "total": "number"
    }
  }'
```

### Customer Support
```bash
curl -X POST https://app-5108296280.us-central1.run.app/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am frustrated with order #12345. Late delivery, damaged item. Need refund ASAP!",
    "schema": {
      "issue_type": "string",
      "order_id": "string", 
      "problems": "array",
      "sentiment": "string",
      "priority": "string"
    }
  }'
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid schema format",
  "code": "INVALID_SCHEMA",
  "suggestions": ["Use 'string' instead of 'text' for type"],
  "request_id": "req_123456789"
}
```

### 429 Rate Limited
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60,
  "request_id": "req_123456789"
}
```

## Rate Limits

| Tier | Requests/Hour | Requests/Month |
|------|---------------|----------------|
| Free | 100 | 1,000 |
| Standard | 1,000 | 10,000 |
| Pro | 10,000 | 100,000 |
| Enterprise | Custom | Custom |

## Best Practices

### Schema Design
- Use simple, descriptive field names
- Prefer `string` over complex types when possible
- Keep schemas flat when feasible
- Use `array` for lists of similar items

### Text Preparation
- Remove unnecessary formatting when possible
- Provide context in the `context` field for better accuracy
- Break large documents into logical chunks

### Error Handling
- Always check the `success` field
- Use `request_id` for debugging
- Implement exponential backoff for rate limits

## OpenAPI Specification

Download the complete OpenAPI spec:
```bash
curl https://app-5108296280.us-central1.run.app/v1/openapi.json
```

## SDKs

- **Node.js**: `npm install parserator-sdk`
- **Python**: `pip install parserator-sdk`
- **MCP Server**: `npm install -g parserator-mcp-server`

## Support

- Email: support@parserator.com
- GitHub: https://github.com/domusgpt/parserator/issues
- Documentation: https://parserator.com/docs
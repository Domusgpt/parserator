# Parserator API Documentation

## Overview

The Parserator API provides intelligent data parsing through a RESTful interface. Built on the Architect-Extractor pattern, it transforms any unstructured data into clean, structured JSON with 70% token efficiency compared to traditional approaches.

## Base URL

```
Production: https://api.parserator.com
Development: http://localhost:5001/parserator/us-central1/api
```

## Authentication

All API requests require authentication via API key in the Authorization header:

```bash
Authorization: Bearer pk_live_your_api_key_here
```

### API Key Types
- `pk_test_...` - Test keys for development (free tier limits)
- `pk_live_...` - Production keys for live applications

## Core Endpoint

### POST /v1/parse

Transform unstructured data into structured JSON.

#### Request Format

```json
{
  "inputData": "string",        // Required: Raw unstructured data
  "outputSchema": "object",     // Required: Desired JSON structure
  "instructions": "string"      // Optional: Additional parsing guidance
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputData` | string | ✅ | The unstructured data to parse (max 100KB) |
| `outputSchema` | object | ✅ | JSON object defining the desired output structure |
| `instructions` | string | ❌ | Optional additional context for parsing |

#### Output Schema Format

Define your desired structure using simple type hints:

```json
{
  "customerName": "string",
  "email": "string", 
  "phoneNumber": "string",
  "orderTotal": "number",
  "orderDate": "iso_date",
  "items": "string_array",
  "isVip": "boolean",
  "website": "url"
}
```

**Supported Types:**
- `string` - Plain text
- `email` - Email address format
- `number` - Numeric value (int or float)
- `iso_date` - Date in YYYY-MM-DD format
- `string_array` - Array of strings
- `boolean` - true/false
- `url` - Valid URL format
- `phone` - Phone number (any format)
- `json_object` - Nested object

#### Success Response

```json
{
  "success": true,
  "parsedData": {
    "customerName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "555-123-4567"
  },
  "metadata": {
    "architectPlan": {
      "steps": [...],
      "totalSteps": 3,
      "estimatedComplexity": "low",
      "architectConfidence": 0.95
    },
    "confidence": 0.92,
    "tokensUsed": 1250,
    "processingTimeMs": 800,
    "architectTokens": 450,
    "extractorTokens": 800,
    "stageBreakdown": {
      "architect": {
        "timeMs": 300,
        "tokens": 450,
        "confidence": 0.95
      },
      "extractor": {
        "timeMs": 500,
        "tokens": 800,
        "confidence": 0.90
      }
    }
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT_DATA",
    "message": "Input data cannot be empty",
    "stage": "validation",
    "details": {
      "requestId": "req_abc123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Examples

### Basic Customer Data Extraction

```bash
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer pk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Customer: John Doe\nEmail: john@example.com\nPhone: (555) 123-4567\nOrder Total: $99.99",
    "outputSchema": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "total": "number"
    }
  }'
```

### Email Processing

```bash
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer pk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Hi there, I need to schedule a meeting for next Tuesday at 2pm. My contact info is jane@company.com and 555-987-6543.",
    "outputSchema": {
      "sender": "string",
      "email": "string",
      "phone": "string",
      "meeting_request": "boolean",
      "proposed_time": "string"
    },
    "instructions": "Extract meeting request details and contact information"
  }'
```

### CSV/Structured Data

```bash
curl -X POST https://api.parserator.com/v1/parse \
  -H "Authorization: Bearer pk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Name,Email,Company,Phone\nJohn Doe,john@acme.com,Acme Corp,555-1234\nJane Smith,jane@beta.co,Beta Inc,555-5678",
    "outputSchema": {
      "contacts": "json_object"
    },
    "instructions": "Parse the first contact from the CSV data"
  }'
```

## Utility Endpoints

### GET /health

Check service health and availability.

```bash
curl https://api.parserator.com/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "gemini": true,
    "architect": true,
    "extractor": true
  }
}
```

### GET /v1/info

Get API information and available endpoints.

```bash
curl https://api.parserator.com/v1/info
```

**Response:**
```json
{
  "name": "Parserator API",
  "version": "1.0.0",
  "description": "Intelligent data parsing using advanced AI",
  "architecture": "Two-stage Architect-Extractor pattern",
  "model": "Gemini 1.5 Flash",
  "documentation": "https://docs.parserator.com",
  "endpoints": {
    "POST /v1/parse": "Main parsing endpoint",
    "GET /health": "Service health check",
    "GET /v1/info": "API information"
  }
}
```

## Error Codes

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| `INVALID_INPUT_DATA` | Input data is missing or invalid | 400 | Provide valid input data |
| `EMPTY_INPUT_DATA` | Input data cannot be empty | 400 | Include non-empty input data |
| `INPUT_TOO_LARGE` | Input exceeds 100KB limit | 400 | Reduce input data size |
| `INVALID_OUTPUT_SCHEMA` | Output schema is malformed | 400 | Fix schema format |
| `EMPTY_OUTPUT_SCHEMA` | Output schema cannot be empty | 400 | Define desired output fields |
| `SCHEMA_TOO_LARGE` | Too many fields in schema | 400 | Reduce number of output fields |
| `ARCHITECT_FAILED` | Planning stage failed | 500 | Retry or contact support |
| `EXTRACTOR_FAILED` | Extraction stage failed | 500 | Retry or contact support |
| `LLM_ERROR` | Gemini API error | 500 | Check service status |
| `QUOTA_EXCEEDED` | API usage limit reached | 429 | Upgrade plan or wait |
| `INVALID_API_KEY` | Authentication failed | 401 | Check API key |
| `REQUEST_TIMEOUT` | Request took too long | 408 | Try with smaller input |

## Rate Limiting

Rate limits are enforced based on your subscription tier:

| Tier | Requests/Month | Burst Limit |
|------|----------------|-------------|
| Free | 100 | 10/minute |
| Startup | 2,000 | 50/minute |
| Pro | 10,000 | 200/minute |
| Enterprise | Custom | Custom |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1847
X-RateLimit-Reset: 1642291200
```

## Best Practices

### 1. Optimize Input Size
- Use representative samples for large datasets
- Break large documents into smaller chunks
- Focus on the most relevant sections

### 2. Design Clear Schemas
```json
// Good: Descriptive field names
{
  "customerName": "string",
  "customerEmail": "string",
  "orderTotal": "number"
}

// Avoid: Ambiguous names
{
  "field1": "string",
  "data": "string",
  "value": "number"
}
```

### 3. Use Instructions Effectively
```json
{
  "inputData": "...",
  "outputSchema": {...},
  "instructions": "Focus on the billing section, ignore shipping details"
}
```

### 4. Handle Errors Gracefully
```javascript
try {
  const result = await fetch('/v1/parse', {...});
  if (!result.success) {
    console.error('Parse failed:', result.error.message);
    // Handle specific error types
    if (result.error.code === 'LOW_CONFIDENCE') {
      // Maybe try with additional instructions
    }
  }
} catch (error) {
  // Handle network/system errors
}
```

### 5. Monitor Token Usage
```javascript
const result = await parserator.parse({...});
console.log(`Tokens used: ${result.metadata.tokensUsed}`);
console.log(`Confidence: ${result.metadata.confidence}`);
```

## SDK Integration

For easier integration, consider using our official SDKs:

- [Node.js SDK](./SDK_NODE_DOCUMENTATION.md)
- [Python SDK](./SDK_PYTHON_DOCUMENTATION.md)
- [CLI Tool](./CLI_DOCUMENTATION.md)

## Support

- **Documentation**: https://docs.parserator.com
- **Status Page**: https://status.parserator.com
- **Support Email**: support@parserator.com

---

*API Version: 1.0.0 | Last Updated: January 2024*
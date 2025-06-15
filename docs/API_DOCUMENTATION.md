# Parserator API Documentation

## Overview

The Parserator API provides intelligent data parsing through a RESTful interface. Built on the Architect-Extractor pattern, it transforms any unstructured data into clean, structured JSON with 70% token efficiency compared to traditional approaches.

## Base URL

```
Production: https://api.parserator.com
Development: http://localhost:5001/parserator/us-central1/api
```

## Authentication

All API requests to protected endpoints must be authenticated. This is typically done by providing an API key.

**Passing the API Key:**

Include your API key in the `Authorization` header with the `Bearer` scheme:

```http
Authorization: Bearer <YOUR_API_KEY>
```
Example: `Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxxxxxxx`

**Obtaining API Keys:**

API keys can be managed (created, listed, deleted) via the API key management endpoints (see below) after authenticating as a user (e.g., through the user dashboard or a Firebase authenticated session). Each API key is tied to your user account and inherits your current subscription tier's usage limits.

**API Key Types & Prefixes:**
- `pk_live_...`: Live keys intended for production use.
- `pk_test_...`: Test keys intended for development and testing purposes. These keys might be subject to different limits or behavior in the future.

API keys should be kept confidential and stored securely.

## API Key Management Endpoints

These endpoints allow authenticated users (via user session, not API key) to manage their API keys.

### POST /api/keys

Create a new API key. The full API key string is returned **only once** upon creation. Store it securely.

**Authentication:** User session (e.g., Firebase ID Token via `X-Firebase-Token` header or similar mechanism).

**Request Body:**

```json
{
  "keyName": "My Production Key",
  "isLive": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `keyName` | string | ✅ |         | A user-friendly name for the key (e.g., "Backend Server Key", "Test Data Script Key"). |
| `isLive` | boolean | ❌ | `true`  | Determines if the key is a live (`pk_live_`) or test (`pk_test_`) key. |

**Success Response (201 Created):**

```json
{
  "message": "API Key created successfully. Store this key securely, it will not be shown again.",
  "apiKey": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // The full API key string
  "keyDetails": {
    "id": "key_abc123xyz789", // The ID of the API key object
    "name": "My Production Key",
    "keyPrefix": "pk_live_",
    "createdAt": "2024-03-15T10:00:00.000Z", // ISO 8601 Timestamp
    "isActive": true,
    "tierWhenCreated": "pro" // The user's subscription tier at the time of key creation
  }
}
```

### GET /api/keys

List all API keys associated with the authenticated user. The full API key strings are **not** returned for security reasons.

**Authentication:** User session.

**Success Response (200 OK):**

```json
[
  {
    "id": "key_abc123xyz789",
    "name": "My Production Key",
    "keyPrefix": "pk_live_",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "isActive": true,
    "tierWhenCreated": "pro"
    // "lastUsedAt": "2024-03-16T12:00:00.000Z" // Optional, if implemented
  },
  {
    "id": "key_def456uvw123",
    "name": "My Test Script Key",
    "keyPrefix": "pk_test_",
    "createdAt": "2024-03-14T09:00:00.000Z",
    "isActive": true,
    "tierWhenCreated": "free"
  }
]
```

### DELETE /api/keys/:keyId

Delete a specific API key by its ID.

**Authentication:** User session.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `keyId`   | string | The ID of the API key to delete (e.g., `key_abc123xyz789`). |

**Success Response (204 No Content):**
An empty response indicating successful deletion.

**Error Responses:**
- `403 Forbidden`: If the key does not belong to the authenticated user.
- `404 Not Found`: If the key ID does not exist.

## Webhook Management Endpoints

Webhooks allow you to receive real-time notifications about events that occur in your Parserator account, such as successful document parsing or processing failures. You configure a webhook by providing a target URL where your application can listen for these events. Parserator will send HTTP POST requests to this URL with a JSON payload detailing the event.

All webhook management endpoints require user session authentication (e.g., Firebase ID Token).

### POST /api/webhooks

Create a new webhook subscription. The webhook's `secretKey` is returned **only once** upon creation. Store it securely to verify incoming webhook signatures.

**Authentication:** User session.

**Request Body:**

```json
{
  "targetUrl": "https://mydomain.com/webhook-receiver",
  "eventNames": ["document.parsed", "document.failed"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetUrl` | string | ✅ | The HTTPS URL on your server where Parserator should send event payloads. |
| `eventNames` | string[] | ✅ | An array of event names you want to subscribe to. See "Webhook Events" section for available event types. |

**Success Response (201 Created):**

```json
{
  "id": "wh_123abc789xyz", // Webhook ID
  "userId": "user_firebase_id",
  "targetUrl": "https://mydomain.com/webhook-receiver",
  "eventNames": ["document.parsed", "document.failed"],
  "secretKey": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Secret key for signature verification
  "createdAt": "2024-03-15T11:00:00.000Z",
  "isActive": true
}
```

### GET /api/webhooks

List all active webhooks for the authenticated user. The `secretKey` is **not** returned for security.

**Authentication:** User session.

**Success Response (200 OK):**

```json
[
  {
    "id": "wh_123abc789xyz",
    "userId": "user_firebase_id",
    "targetUrl": "https://mydomain.com/webhook-receiver",
    "eventNames": ["document.parsed", "document.failed"],
    "createdAt": "2024-03-15T11:00:00.000Z",
    "isActive": true
    // "lastDispatchAt": "2024-03-16T14:00:00.000Z" // Optional
  }
]
```

### DELETE /api/webhooks/:webhookId

Delete a specific webhook subscription by its ID.

**Authentication:** User session.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `webhookId` | string | The ID of the webhook to delete (e.g., `wh_123abc789xyz`). |

**Success Response (204 No Content):**
An empty response indicating successful deletion.

## Webhook Events

When a subscribed event occurs, Parserator will send an HTTP POST request to your webhook's `targetUrl`. The request body will be JSON containing the event details.

**Signature Verification:**

To ensure the request genuinely originated from Parserator, we include a signature in the `X-Parserator-Signature-256` HTTP header. This signature is an HMAC-SHA256 hash of the raw JSON request body, computed using your webhook's `secretKey`.

**Steps to verify:**
1. Retrieve the `secretKey` you stored when creating the webhook.
2. Compute an HMAC-SHA256 hash of the raw request body using this `secretKey`.
3. Compare your computed hash (typically hex-encoded) with the value of the `X-Parserator-Signature-256` header. If they match, the request is authentic.

**Example (Node.js):**
```javascript
const crypto = require('crypto');
// ...
const secret = 'whsec_your_webhook_secret'; // Retrieved from your storage
const requestBody = JSON.stringify(req.body); // Raw JSON string from request
const signatureHeader = req.headers['x-parserator-signature-256'];

const hmac = crypto.createHmac('sha256', secret);
hmac.update(requestBody);
const calculatedSignature = hmac.digest('hex');

if (calculatedSignature === signatureHeader) {
  // Signature is valid
  // Process the webhook payload
} else {
  // Signature is invalid, reject the request
}
```

**Event Payload Structure:**

All webhook events share a common wrapper:

```json
{
  "eventId": "evt_uniqueEventId123", // Unique ID for this specific event delivery
  "timestamp": "2024-03-15T12:00:00.000Z", // ISO 8601 timestamp of when the event occurred
  "eventName": "document.parsed", // The type of event
  "jobId": "job_optionalJobId456", // Optional: Identifier for a parent job, if applicable
  "data": {
    // Event-specific payload goes here
  }
}
```

### Event Types and Payloads:

#### 1. `document.parsed`

Triggered when a document has been successfully parsed.

**`data` object structure (`DocumentParsedPayload`):**
```json
{
  "documentId": "doc_abc123",
  "originalFileName": "invoice.pdf", // Optional
  "extractedData": { /* ... your structured data ... */ },
  "parseStatus": "success",
  "parsedAt": "2024-03-15T12:00:00.000Z" // Timestamp of parsing completion
}
```

#### 2. `document.failed`

Triggered when a document parsing attempt fails.

**`data` object structure (`DocumentFailedPayload`):**
```json
{
  "documentId": "doc_def456",
  "originalFileName": "corrupted_image.jpg", // Optional
  "error": {
    "message": "Failed to extract text from document.",
    "code": "parsing_error" // e.g., 'parsing_error', 'timeout', 'unsupported_format'
  },
  "parseStatus": "failure",
  "failedAt": "2024-03-15T12:05:00.000Z" // Timestamp of failure
}
```

#### 3. `job.status.updated`

Triggered when the status of an asynchronous job changes (e.g., a large document batch).

**`data` object structure (`JobStatusUpdatePayload`):**
```json
{
  "jobId": "job_xyz789",
  "status": "processing", // 'processing', 'completed', 'failed'
  "progress": 50, // Optional: Percentage (0-100)
  "message": "Step 2/4: Extracting text from 500 pages.", // Optional
  "updatedAt": "2024-03-15T12:10:00.000Z" // Timestamp of this status update
}
```

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
<!-- Note: INVALID_API_KEY (401) and QUOTA_EXCEEDED (429) are already listed and relevant. -->
<!-- New specific errors from API Key / Webhook management like 404 for non-existent key/webhook -->
<!-- or 403 for trying to access/delete another user's resource are standard HTTP errors. -->
<!-- The general descriptions for 400, 401, 403, 404, 429, 500 should cover these. -->

## Rate Limiting & Usage Quotas

API requests are subject to rate limits and usage quotas based on the subscription tier associated with the API key used for the request.

**Limits:**
- **Per-Minute Limit:** Restricts the number of requests you can make in any given 60-second window.
- **Monthly Quota:** Restricts the total number of requests you can make in a calendar month (or billing cycle, if applicable). The monthly quota count is reset by a scheduled job (typically at the beginning of the month or billing cycle).

The specific limits for each tier are defined in your account dashboard or service agreement. Example:

| Tier       | Requests per Month | Requests per Minute |
|------------|--------------------|---------------------|
| `free`     | 100                | 10                  |
| `pro`      | 10,000             | 100                 |
| `enterprise` | 100,000            | 1,000               |
| `admin`    | Unlimited          | Unlimited           |
*(Note: These are example values and may not reflect current actual limits.)*

**Exceeding Limits:**

If you exceed these limits, the API will respond with an HTTP `429 Too Many Requests` status code.
The JSON response body will provide more details:

```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded your API usage limits. Monthly remaining: 0. Per-minute limit: 10.",
  "limitType": "month", // "month" or "minute"
  // "retryAfterSeconds": 30, // Only present if limitType is "minute"
  "monthlyLimitResetsAt": "2024-04-01T00:00:00.000Z" // ISO 8601 timestamp of when the monthly quota is expected to reset
}
```

- If `limitType` is `"minute"`, the `retryAfterSeconds` field (integer) suggests how long you should wait before retrying. It's also recommended to implement an exponential backoff strategy for retries.
- If `limitType` is `"month"`, you will need to wait until your quota resets, or consider upgrading your plan.

It's important to handle these 429 responses gracefully in your application.

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
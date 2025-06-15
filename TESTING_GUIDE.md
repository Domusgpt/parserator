# 🧪 PARSERATOR TESTING GUIDE

## 🎯 **Quick Verification Tests**

### **1. Health Check**
```bash
curl "https://app-5108296280.us-central1.run.app/health"
```
**Expected**: `{"status": "healthy", ...}`

### **2. Anonymous Parsing (Should Work)**
```bash
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "John Smith CEO john@company.com (555) 123-4567",
    "outputSchema": {
      "name": "string",
      "title": "string",
      "email": "string",
      "phone": "string"
    }
  }'
```
**Expected**: `{"success": true, "parsedData": {...}, "metadata": {"userTier": "anonymous"}}`

### **3. Fake API Key Test (Should Fail After Fix)**
```bash
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_totally_fake_key_12345" \
  -d '{
    "inputData": "test data",
    "outputSchema": {"data": "string"}
  }'
```
**Current**: ❌ Returns success (security leak)
**After Fix**: ✅ Should return `{"error": "Invalid API key"}`

### **4. Invalid Key Format (Should Always Fail)**
```bash
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "X-API-Key: invalid_format_key" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}'
```
**Expected**: `{"error": "Invalid API key format"}`

## 🔐 **Security Testing**

### **API Key Format Validation**
```bash
# Test various invalid formats
for key in "invalid_key" "sk_test_123" "api_123" "pk_invalid_123"; do
  echo "Testing key: $key"
  curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
    -H "X-API-Key: $key" \
    -d '{"inputData": "test", "outputSchema": {"data": "string"}}' | \
    jq '.error'
done
```

### **Database Validation Test**
```bash
# Create test API key in Firestore first, then test
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "X-API-Key: pk_test_real_database_key_123" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}'
```

### **Authentication Header Variants**
```bash
# Test X-API-Key header
curl -H "X-API-Key: pk_test_123" "https://app-5108296280.us-central1.run.app/v1/parse"

# Test Authorization Bearer
curl -H "Authorization: Bearer pk_live_123" "https://app-5108296280.us-central1.run.app/v1/parse"

# Test case sensitivity
curl -H "x-api-key: pk_test_123" "https://app-5108296280.us-central1.run.app/v1/parse"
```

## 📊 **Rate Limiting Tests**

### **Anonymous Rate Limiting**
```bash
# Send 15 requests rapidly (should hit 10/day limit)
for i in {1..15}; do
  echo "Request $i:"
  curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
    -H "Content-Type: application/json" \
    -d '{"inputData": "test '$i'", "outputSchema": {"data": "string"}}' | \
    jq -r '.error // "SUCCESS"'
  sleep 1
done
```

### **Authenticated User Limits**
```bash
# Test with valid API key (should have higher limits)
for i in {1..60}; do
  echo "Auth Request $i:"
  curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
    -H "X-API-Key: pk_test_valid_key_123" \
    -d '{"inputData": "test '$i'", "outputSchema": {"data": "string"}}' | \
    jq -r '.metadata.userTier // .error'
done
```

## 🔧 **User Management Testing**

### **API Key Generation (Requires Firebase Auth)**
```bash
# Get Firebase ID token first (manual step)
FIREBASE_TOKEN="your_firebase_id_token_here"

# Generate test key
curl -X POST "https://app-5108296280.us-central1.run.app/v1/user/keys" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "environment": "test"
  }'
```

### **List User Keys**
```bash
curl -X GET "https://app-5108296280.us-central1.run.app/v1/user/keys" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"
```

### **Usage Statistics**
```bash
curl -X GET "https://app-5108296280.us-central1.run.app/v1/user/usage" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"
```

## 📈 **Performance Testing**

### **Response Time Test**
```bash
# Test parsing performance
time curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "John Smith, Senior Software Engineer at Google Inc., john.smith@google.com, +1-650-555-1234, LinkedIn: linkedin.com/in/johnsmith, GitHub: github.com/johnsmith, Location: Mountain View, CA, Salary: $180,000, Start Date: 2023-01-15, Manager: Jane Doe",
    "outputSchema": {
      "name": "string",
      "title": "string", 
      "company": "string",
      "email": "string",
      "phone": "string",
      "linkedin": "string",
      "github": "string",
      "location": "string",
      "salary": "string",
      "startDate": "string",
      "manager": "string"
    }
  }' | jq '.metadata.processingTimeMs'
```

### **Concurrent Request Test**
```bash
# Test 10 concurrent requests
for i in {1..10}; do
  (curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
    -d '{"inputData": "Test '$i'", "outputSchema": {"data": "string"}}' | \
    jq -r '.metadata.processingTimeMs // "ERROR"') &
done
wait
```

### **Large Data Test**
```bash
# Test with large input data
LARGE_DATA=$(python3 -c "print('John Doe Engineer ' * 1000)")
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "'$LARGE_DATA'",
    "outputSchema": {"name": "string", "title": "string"}
  }' | jq '.metadata.processingTimeMs'
```

## 🧩 **Schema Validation Tests**

### **Various Data Types**
```bash
# Test different output schema types
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Product: MacBook Pro, Price: $2399, Rating: 4.8, Available: true, Features: Fast, Lightweight, Durable",
    "outputSchema": {
      "name": "string",
      "price": "number",
      "rating": "number", 
      "available": "boolean",
      "features": "array"
    }
  }'
```

### **Edge Cases**
```bash
# Empty input
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "", "outputSchema": {"data": "string"}}'

# Missing schema
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "test"}'

# Invalid JSON
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{"inputData": "test", "outputSchema"'
```

## 📊 **Structured Output Validation**

### **JSON Parsing Test**
```bash
# Verify all responses are valid JSON
curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "John Doe", "outputSchema": {"name": "string"}}' | \
  python3 -m json.tool > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```

### **Schema Compliance Test**
```bash
# Test that output matches requested schema
RESPONSE=$(curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "John Doe Engineer", "outputSchema": {"name": "string", "title": "string"}}')

echo $RESPONSE | jq -e '.parsedData.name' > /dev/null && echo "✅ Name field present"
echo $RESPONSE | jq -e '.parsedData.title' > /dev/null && echo "✅ Title field present"
echo $RESPONSE | jq -e '.success == true' > /dev/null && echo "✅ Success flag correct"
```

## 🔍 **Error Handling Tests**

### **Network Error Simulation**
```bash
# Test timeout behavior
timeout 1 curl "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}'
```

### **Malformed Request Tests**
```bash
# Invalid Content-Type
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -H "Content-Type: text/plain" \
  -d "not json"

# Wrong HTTP method
curl -X GET "https://app-5108296280.us-central1.run.app/v1/parse"

# Missing Content-Type
curl -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}'
```

## 📝 **Test Result Analysis**

### **Success Criteria**
- ✅ Health check returns 200 status
- ✅ Anonymous parsing works without API key
- ✅ Valid API keys are accepted
- ✅ Invalid API keys are rejected
- ✅ Fake API keys are rejected (after security fix)
- ✅ Rate limiting enforces tier limits
- ✅ All responses are valid JSON
- ✅ Response times under 5 seconds
- ✅ User management endpoints work with Firebase Auth

### **Security Validation**
- ✅ No fake API keys accepted
- ✅ Format validation working
- ✅ Database validation enforced
- ✅ Rate limiting prevents abuse
- ✅ Usage tracking working

### **Performance Benchmarks**
- ✅ Simple parsing: < 2 seconds
- ✅ Complex parsing: < 5 seconds
- ✅ Concurrent requests: No degradation
- ✅ Large data: Handles up to 10KB input

## 🚀 **Automated Test Script**

```bash
#!/bin/bash
# Complete API test suite

BASE_URL="https://app-5108296280.us-central1.run.app"
TOTAL_TESTS=0
PASSED_TESTS=0

test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected="$3"
  local method="${4:-GET}"
  
  echo "Testing: $name"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [ "$method" = "POST" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d '{"inputData": "test", "outputSchema": {"data": "string"}}')
  else
    RESPONSE=$(curl -s "$BASE_URL$endpoint")
  fi
  
  if echo "$RESPONSE" | grep -q "$expected"; then
    echo "✅ PASS: $name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "❌ FAIL: $name"
    echo "   Expected: $expected"
    echo "   Got: $RESPONSE"
  fi
  echo ""
}

# Run tests
test_endpoint "Health Check" "/health" "healthy"
test_endpoint "API Info" "/v1/info" "Parserator API"
test_endpoint "Anonymous Parsing" "/v1/parse" "success" "POST"
test_endpoint "Invalid Key Format" "/v1/parse" "Invalid API key format" "POST"

echo "Results: $PASSED_TESTS/$TOTAL_TESTS tests passed"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed"
  exit 1
fi
```

Save as `test_api.sh`, make executable with `chmod +x test_api.sh`, then run with `./test_api.sh`
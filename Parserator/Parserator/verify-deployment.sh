#!/bin/bash

# 🔍 PARSERATOR DEPLOYMENT VERIFICATION SCRIPT

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Verifying Parserator Deployment..."

# Test API endpoint
echo -e "\n${BLUE}1. Testing API Endpoint${NC}"
API_RESPONSE=$(curl -s -X POST "https://us-central1-parserator-production.cloudfunctions.net/app/v1/parse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_test_demo_key" \
  -d '{
    "inputData": "Alice Smith alice@test.com +1-555-0199", 
    "outputSchema": {
      "name": "string",
      "email": "string", 
      "phone": "string"
    }
  }' \
  -w "%{http_code}")

if [[ $API_RESPONSE == *"200"* ]]; then
    echo -e "${GREEN}✅ API is responding correctly${NC}"
else
    echo -e "${RED}❌ API test failed${NC}"
    echo "Response: $API_RESPONSE"
fi

# Test marketing website
echo -e "\n${BLUE}2. Testing Marketing Website${NC}"
WEBSITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://parserator-production.web.app)

if [ "$WEBSITE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Marketing website is live${NC}"
else
    echo -e "${RED}❌ Website test failed (Status: $WEBSITE_STATUS)${NC}"
fi

# Check Firebase Functions
echo -e "\n${BLUE}3. Checking Firebase Functions${NC}"
firebase functions:list 2>/dev/null | grep -q "app"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firebase functions are deployed${NC}"
else
    echo -e "${RED}❌ Firebase functions check failed${NC}"
fi

# Performance test
echo -e "\n${BLUE}4. Performance Test${NC}"
START_TIME=$(date +%s%3N)
curl -s -X POST "https://us-central1-parserator-production.cloudfunctions.net/app/v1/parse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_test_demo_key" \
  -d '{
    "inputData": "Performance Test User perf@test.com 123-456-7890 Order: $99.99", 
    "outputSchema": {
      "name": "string",
      "email": "string", 
      "phone": "string",
      "amount": "number"
    }
  }' > /dev/null
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✅ API response time: ${DURATION}ms${NC}"

echo -e "\n${GREEN}🎉 VERIFICATION COMPLETE!${NC}"
echo -e "📍 API: https://us-central1-parserator-production.cloudfunctions.net/app"
echo -e "🌐 Website: https://parserator-production.web.app"
echo -e "⚡ Performance: ${DURATION}ms average response time"
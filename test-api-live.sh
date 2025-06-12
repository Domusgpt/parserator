#!/bin/bash

echo "🔍 Testing Parserator API endpoints..."

# Test main function URL
echo "Testing: https://us-central1-parserator-production.cloudfunctions.net/app/health"
RESPONSE1=$(curl -s https://us-central1-parserator-production.cloudfunctions.net/app/health -w "%{http_code}")

# Test Cloud Run URL  
echo "Testing: https://app-yaqhigptga-uc.a.run.app/health"
RESPONSE2=$(curl -s https://app-yaqhigptga-uc.a.run.app/health -w "%{http_code}")

if [[ $RESPONSE1 == *"200"* ]]; then
    echo "✅ Main function URL is working!"
    echo "🔗 API Base: https://us-central1-parserator-production.cloudfunctions.net/app"
elif [[ $RESPONSE2 == *"200"* ]]; then
    echo "✅ Cloud Run URL is working!"
    echo "🔗 API Base: https://app-yaqhigptga-uc.a.run.app"
else
    echo "⏳ Still deploying... Try again in 1-2 minutes"
fi

echo ""
echo "🚀 Once working, test the parse endpoint:"
echo 'curl -X POST {API_BASE}/v1/parse -H "Content-Type: application/json" -d '"'"'{"inputData": "John Doe john@test.com", "outputSchema": {"name": "string", "email": "string"}}'"'"
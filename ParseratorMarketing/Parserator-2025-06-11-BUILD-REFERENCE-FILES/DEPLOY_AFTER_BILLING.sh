#!/bin/bash

# 🚀 PARSERATOR PRODUCTION DEPLOYMENT SCRIPT
# Run this AFTER upgrading Firebase to Blaze plan

echo "🚀 Starting Parserator Production Deployment..."
echo "⚠️  Ensure Firebase project is upgraded to Blaze plan first!"

# Set color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📍 Current directory: $(pwd)${NC}"

# Step 1: Set Gemini API Key
echo -e "\n${YELLOW}🔑 STEP 1: Setting Gemini API Key${NC}"
echo "Your Gemini API Key: AIzaSyB0-rtYB0XkqQ1ZrjWGi-x8gOJxYnSDCwE"
echo "Setting as Firebase secret..."

echo "AIzaSyB0-rtYB0XkqQ1ZrjWGi-x8gOJxYnSDCwE" | firebase functions:secrets:set GEMINI_API_KEY --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Gemini API key set successfully!${NC}"
else
    echo -e "${RED}❌ Failed to set API key. Check Firebase billing status.${NC}"
    exit 1
fi

# Step 2: Deploy API Functions
echo -e "\n${YELLOW}🚀 STEP 2: Deploying API Functions${NC}"
cd packages/api
echo "Deploying from: $(pwd)"

firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API Functions deployed successfully!${NC}"
    echo -e "${BLUE}📍 Your API endpoint: https://us-central1-parserator-production.cloudfunctions.net/app${NC}"
else
    echo -e "${RED}❌ API deployment failed${NC}"
    exit 1
fi

# Step 3: Deploy Marketing Website
echo -e "\n${YELLOW}🌐 STEP 3: Deploying Marketing Website${NC}"
cd /mnt/c/Users/millz/ParseratorMarketing/website
echo "Deploying from: $(pwd)"

# Make deploy script executable
chmod +x deploy.sh
./deploy.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Marketing website deployed successfully!${NC}"
    echo -e "${BLUE}📍 Your website: https://parserator-production.web.app${NC}"
else
    echo -e "${RED}❌ Website deployment failed${NC}"
    cd /mnt/c/Users/millz/Parserator
fi

# Step 4: Test API Deployment
echo -e "\n${YELLOW}🧪 STEP 4: Testing Live API${NC}"
cd /mnt/c/Users/millz/Parserator

echo "Testing API endpoint..."
curl -X POST "https://us-central1-parserator-production.cloudfunctions.net/app/v1/parse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_test_demo_key" \
  -d '{
    "inputData": "John Doe john@example.com (555) 123-4567", 
    "outputSchema": {
      "name": "string",
      "email": "string", 
      "phone": "string"
    }
  }' \
  --max-time 30 \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

# Step 5: Create Initial Users
echo -e "\n${YELLOW}👥 STEP 5: Creating Initial Test Users${NC}"
cd packages/api

echo "Creating test users with API keys..."

# Create manual users using our utility
npx ts-node src/utils/generate-api-key.ts test@parserator.com pro
npx ts-node src/utils/generate-api-key.ts demo@parserator.com free
npx ts-node src/utils/generate-api-key.ts enterprise@parserator.com enterprise

# Step 6: Prepare SDK Publishing
echo -e "\n${YELLOW}📦 STEP 6: Preparing SDK for Publishing${NC}"
cd /mnt/c/Users/millz/Parserator/packages/sdk-node

echo "Building SDK..."
npm run build

echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "\n${BLUE}📋 DEPLOYMENT SUMMARY:${NC}"
echo -e "🔗 API Endpoint: https://us-central1-parserator-production.cloudfunctions.net/app"
echo -e "🌐 Marketing Site: https://parserator-production.web.app"  
echo -e "🔑 Test API keys created for: test@parserator.com, demo@parserator.com, enterprise@parserator.com"
echo -e "📦 SDK ready for NPM publishing"

echo -e "\n${YELLOW}🎯 NEXT STEPS:${NC}"
echo -e "1. Test your live API with the generated keys"
echo -e "2. Publish SDK: cd packages/sdk-node && npm publish --access public"
echo -e "3. Share on social media and developer communities"
echo -e "4. Monitor usage in Firebase Console"

echo -e "\n${GREEN}🚀 PARSERATOR IS LIVE! Ready for the EMA revolution!${NC}"
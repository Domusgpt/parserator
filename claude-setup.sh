#!/bin/bash

# 🤖 Claude Code Environment Setup Script
# Sets up optimal environment for Firebase Functions debugging and deployment

echo "🤖 Setting up Claude Code environment for Parserator development..."

# Install essential CLI tools
echo "📦 Installing essential tools..."

# Install jq for JSON parsing (if not installed)
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Install ripgrep for better searching (if not installed)
if ! command -v rg &> /dev/null; then
    echo "Installing ripgrep..."
    sudo apt-get install -y ripgrep
fi

# Install curl and other utilities (if not installed)
sudo apt-get install -y curl wget git tree

# Set up Firebase debugging environment
echo "🔥 Configuring Firebase debugging environment..."

# Increase Firebase discovery timeout for complex functions
export FUNCTIONS_DISCOVERY_TIMEOUT=60
echo "export FUNCTIONS_DISCOVERY_TIMEOUT=60" >> ~/.bashrc

# Set Firebase debug mode
export FIREBASE_DEBUG=true
echo "export FIREBASE_DEBUG=true" >> ~/.bashrc

# Set Node.js options for better debugging
export NODE_OPTIONS="--max-old-space-size=4096"
echo "export NODE_OPTIONS=\"--max-old-space-size=4096\"" >> ~/.bashrc

# Firebase Functions debugging utilities
echo "🔧 Creating Firebase debugging utilities..."

# Create deployment helper script
cat > /tmp/firebase-deploy-debug.sh << 'EOF'
#!/bin/bash
echo "🚀 Enhanced Firebase Deployment Debug Script"
echo "Project: $(firebase use)"
echo "Node Version: $(node --version)"
echo "Firebase CLI: $(firebase --version)"
echo "Current Dir: $(pwd)"
echo ""

# Check for common issues
echo "🔍 Pre-deployment checks:"

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "   Main: $(jq -r '.main' package.json)"
    echo "   Node: $(jq -r '.engines.node' package.json)"
else
    echo "❌ package.json not found"
fi

# Check firebase.json
if [ -f "firebase.json" ]; then
    echo "✅ firebase.json found"
    echo "   Runtime: $(jq -r '.functions[0].runtime' firebase.json)"
    echo "   Source: $(jq -r '.functions[0].source' firebase.json)"
else
    echo "❌ firebase.json not found"
fi

# Check for multiple index files (common cause of deployment timeout)
echo ""
echo "🔍 Checking for conflicting index files..."
find . -name "index*.ts" -o -name "index*.js" | grep -v node_modules | head -10

echo ""
echo "🔍 Checking built files..."
if [ -d "lib" ]; then
    echo "✅ lib directory exists"
    ls -la lib/index.*
else
    echo "❌ lib directory not found - run 'npm run build' first"
fi

echo ""
echo "🚀 Starting deployment with extended timeout..."
FUNCTIONS_DISCOVERY_TIMEOUT=60 firebase deploy --only functions --debug
EOF

chmod +x /tmp/firebase-deploy-debug.sh
sudo mv /tmp/firebase-deploy-debug.sh /usr/local/bin/firebase-deploy-debug

# Create API testing utilities
echo "🧪 Creating API testing utilities..."

cat > /tmp/parserator-test.sh << 'EOF'
#!/bin/bash

BASE_URL="https://app-5108296280.us-central1.run.app"

echo "🧪 Parserator API Test Suite"
echo "================================"

# Test 1: Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq . || echo "❌ Failed"
echo ""

# Test 2: API Info
echo "2. API Info:"
curl -s "$BASE_URL/v1/info" | jq . || echo "❌ Failed"
echo ""

# Test 3: Anonymous Parsing
echo "3. Anonymous Parsing:"
curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{"inputData": "John Smith CEO john@test.com", "outputSchema": {"name": "string", "title": "string", "email": "string"}}' | \
  jq . || echo "❌ Failed"
echo ""

# Test 4: Security Test - Fake API Key (should fail after security fix)
echo "4. Security Test - Fake API Key:"
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_fake_key_12345" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}')

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "✅ Security working - fake key rejected"
else
    echo "🚨 SECURITY LEAK - fake key accepted!"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 5: Format Validation
echo "5. API Key Format Validation:"
curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_format" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}' | \
  jq . || echo "❌ Failed"
echo ""

echo "🏁 Test suite complete!"
EOF

chmod +x /tmp/parserator-test.sh
sudo mv /tmp/parserator-test.sh /usr/local/bin/parserator-test

# Create Firebase project info utility
cat > /tmp/firebase-info.sh << 'EOF'
#!/bin/bash

echo "🔥 Firebase Project Information"
echo "==============================="

echo "Current Project: $(firebase use)"
echo "Project List:"
firebase projects:list

echo ""
echo "Firebase Functions Status:"
firebase functions:list

echo ""
echo "Recent Logs (last 10):"
firebase functions:log --limit 10

echo ""
echo "Environment Config:"
firebase functions:config:get
EOF

chmod +x /tmp/firebase-info.sh
sudo mv /tmp/firebase-info.sh /usr/local/bin/firebase-info

# Create dependency analyzer
cat > /tmp/analyze-deps.sh << 'EOF'
#!/bin/bash

echo "📦 Dependency Analysis for Firebase Functions"
echo "============================================="

if [ -f "package.json" ]; then
    echo "📋 Dependencies:"
    jq '.dependencies' package.json
    
    echo ""
    echo "🔍 Heavy Dependencies (likely causes of timeout):"
    
    # Check for known problematic dependencies
    HEAVY_DEPS=("@google/generative-ai" "@tensorflow" "pytorch" "opencv" "sharp" "canvas")
    
    for dep in "${HEAVY_DEPS[@]}"; do
        if jq -e ".dependencies.\"$dep\"" package.json >/dev/null 2>&1; then
            echo "⚠️  Found: $dep (may cause deployment timeout)"
        fi
    done
    
    echo ""
    echo "💡 Node Modules Size:"
    if [ -d "node_modules" ]; then
        du -sh node_modules
    else
        echo "node_modules not found"
    fi
    
    echo ""
    echo "📁 Build Output Size:"
    if [ -d "lib" ]; then
        du -sh lib
        echo "Files in lib/:"
        ls -la lib/
    else
        echo "lib directory not found"
    fi
else
    echo "❌ package.json not found"
fi
EOF

chmod +x /tmp/analyze-deps.sh
sudo mv /tmp/analyze-deps.sh /usr/local/bin/analyze-deps

# Create quick deployment alternatives script
cat > /tmp/firebase-alternatives.sh << 'EOF'
#!/bin/bash

echo "🚀 Firebase Deployment Alternatives"
echo "===================================="

echo "If Firebase CLI deployment times out, try these alternatives:"
echo ""

echo "1. 📱 Firebase Console Upload:"
echo "   - Go to: https://console.firebase.google.com"
echo "   - Navigate to Functions"
echo "   - Upload the built function manually"
echo ""

echo "2. ☁️  Google Cloud CLI:"
echo "   gcloud functions deploy app \\"
echo "     --runtime nodejs20 \\"
echo "     --trigger-http \\"
echo "     --allow-unauthenticated \\"
echo "     --source . \\"
echo "     --entry-point app"
echo ""

echo "3. 🔧 Simplified Function:"
echo "   - Remove heavy dependencies temporarily"
echo "   - Deploy minimal function first"
echo "   - Add features incrementally"
echo ""

echo "4. 📊 Debug Current Deployment:"
echo "   firebase-deploy-debug"
echo ""

echo "5. 🧪 Test Current API:"
echo "   parserator-test"
EOF

chmod +x /tmp/firebase-alternatives.sh
sudo mv /tmp/firebase-alternatives.sh /usr/local/bin/firebase-alternatives

# Set up project-specific aliases
echo "⚡ Setting up project aliases..."

cat >> ~/.bashrc << 'EOF'

# Parserator Development Aliases
alias pd='cd /mnt/c/Users/millz/parserator-launch-ready'
alias api='cd /mnt/c/Users/millz/parserator-launch-ready/packages/api'
alias build='npm run build'
alias deploy='firebase-deploy-debug'
alias test-api='parserator-test'
alias logs='firebase functions:log --limit 20'
alias finfo='firebase-info'
alias deps='analyze-deps'
alias alt='firebase-alternatives'

# Enhanced commands
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='rg'
alias find='fd'
EOF

# Create environment check script
cat > /tmp/env-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Environment Check for Claude Code"
echo "===================================="

echo "📍 Current Directory: $(pwd)"
echo "🔧 Node Version: $(node --version)"
echo "📦 NPM Version: $(npm --version)"
echo "🔥 Firebase CLI: $(firebase --version)"
echo "☁️  gcloud CLI: $(gcloud --version | head -1)"
echo "🦀 Rust Tools:"
echo "   - ripgrep: $(rg --version | head -1)"
echo ""

echo "🌍 Environment Variables:"
echo "   FUNCTIONS_DISCOVERY_TIMEOUT: $FUNCTIONS_DISCOVERY_TIMEOUT"
echo "   FIREBASE_DEBUG: $FIREBASE_DEBUG"
echo "   NODE_OPTIONS: $NODE_OPTIONS"
echo ""

echo "🔥 Firebase Project: $(firebase use 2>/dev/null || echo 'Not set')"
echo ""

echo "📋 Available Commands:"
echo "   firebase-deploy-debug  - Enhanced deployment with debugging"
echo "   parserator-test       - Test API endpoints"
echo "   firebase-info         - Project information"
echo "   analyze-deps          - Dependency analysis"
echo "   firebase-alternatives - Alternative deployment methods"
echo ""

echo "⚡ Quick Aliases:"
echo "   pd    - Go to project directory"
echo "   api   - Go to API directory"  
echo "   build - Build the project"
echo "   deploy- Deploy with debugging"
echo "   test-api - Test the API"
echo "   logs  - View function logs"
EOF

chmod +x /tmp/env-check.sh
sudo mv /tmp/env-check.sh /usr/local/bin/env-check

echo "✅ Setup complete!"
echo ""
echo "🎉 Claude Code environment is now optimized!"
echo ""
echo "💡 Quick start:"
echo "   1. Run 'env-check' to verify everything is working"
echo "   2. Use 'firebase-deploy-debug' for enhanced deployment"
echo "   3. Use 'parserator-test' to test the API"
echo "   4. Use 'firebase-alternatives' if deployment fails"
echo ""
echo "⚡ Restart your terminal or run 'source ~/.bashrc' to activate aliases"
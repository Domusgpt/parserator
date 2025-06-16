#!/bin/bash
# Jules Environment Setup Script for Parserator Development
# Optimized for Firebase Functions, API development, and debugging

set -e

echo "🚀 Setting up Jules' development environment for Parserator projects..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    print_info "Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    print_info "Detected Linux"
else
    print_error "Unsupported OS: $OSTYPE"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Homebrew on macOS
if [[ "$OS" == "mac" ]] && ! command_exists brew; then
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    export PATH="/opt/homebrew/bin:$PATH"
fi

# Update package managers
print_header "📦 Updating package managers..."
if [[ "$OS" == "mac" ]]; then
    brew update
elif [[ "$OS" == "linux" ]]; then
    if command_exists apt; then
        sudo apt update
    elif command_exists yum; then
        sudo yum update -y
    elif command_exists pacman; then
        sudo pacman -Sy
    fi
fi

# Install core development tools
print_header "🔧 Installing core development tools..."

# Git
if ! command_exists git; then
    print_info "Installing Git..."
    if [[ "$OS" == "mac" ]]; then
        brew install git
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y git
        elif command_exists yum; then
            sudo yum install -y git
        elif command_exists pacman; then
            sudo pacman -S git --noconfirm
        fi
    fi
    print_status "Git installed"
else
    print_status "Git already installed"
fi

# GitHub CLI
if ! command_exists gh; then
    print_info "Installing GitHub CLI..."
    if [[ "$OS" == "mac" ]]; then
        brew install gh
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            type -p curl >/dev/null || sudo apt install curl -y
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh -y
        elif command_exists yum; then
            sudo dnf install 'dnf-command(config-manager)' -y
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh -y
        fi
    fi
    print_status "GitHub CLI installed"
else
    print_status "GitHub CLI already installed"
fi

# Node.js and npm (version 20 LTS for Firebase Functions compatibility)
if ! command_exists node; then
    print_info "Installing Node.js 20 LTS..."
    if [[ "$OS" == "mac" ]]; then
        brew install node@20
        brew link node@20 --force
    elif [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        if command_exists apt; then
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs npm
        fi
    fi
    print_status "Node.js 20 LTS installed"
else
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 20 ]; then
        print_warning "Node.js version $node_version detected. Upgrading to Node.js 20 LTS..."
        if [[ "$OS" == "mac" ]]; then
            brew install node@20
            brew link node@20 --force
        elif [[ "$OS" == "linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            if command_exists apt; then
                sudo apt-get install -y nodejs
            fi
        fi
        print_status "Node.js upgraded to 20 LTS"
    else
        print_status "Node.js already installed (compatible version)"
    fi
fi

# Essential CLI tools for debugging
print_header "🛠️ Installing essential debugging tools..."

# jq for JSON parsing
if ! command_exists jq; then
    print_info "Installing jq (JSON processor)..."
    if [[ "$OS" == "mac" ]]; then
        brew install jq
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y jq
        elif command_exists yum; then
            sudo yum install -y jq
        elif command_exists pacman; then
            sudo pacman -S jq --noconfirm
        fi
    fi
    print_status "jq installed"
else
    print_status "jq already installed"
fi

# ripgrep for faster searching
if ! command_exists rg; then
    print_info "Installing ripgrep (faster grep)..."
    if [[ "$OS" == "mac" ]]; then
        brew install ripgrep
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y ripgrep
        elif command_exists yum; then
            sudo yum install -y ripgrep
        elif command_exists pacman; then
            sudo pacman -S ripgrep --noconfirm
        fi
    fi
    print_status "ripgrep installed"
else
    print_status "ripgrep already installed"
fi

# tree for directory visualization
if ! command_exists tree; then
    print_info "Installing tree..."
    if [[ "$OS" == "mac" ]]; then
        brew install tree
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y tree
        elif command_exists yum; then
            sudo yum install -y tree
        elif command_exists pacman; then
            sudo pacman -S tree --noconfirm
        fi
    fi
    print_status "tree installed"
else
    print_status "tree already installed"
fi

# curl, wget (essential for API testing)
print_info "Installing curl and wget..."
if [[ "$OS" == "mac" ]]; then
    brew install curl wget
elif [[ "$OS" == "linux" ]]; then
    if command_exists apt; then
        sudo apt install -y curl wget
    elif command_exists yum; then
        sudo yum install -y curl wget
    elif command_exists pacman; then
        sudo pacman -S curl wget --noconfirm
    fi
fi
print_status "curl and wget installed"

# Google Cloud CLI
if ! command_exists gcloud; then
    print_info "Installing Google Cloud CLI..."
    if [[ "$OS" == "mac" ]]; then
        brew install --cask google-cloud-sdk
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
            curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
            sudo apt update && sudo apt install -y google-cloud-cli
        fi
    fi
    print_status "Google Cloud CLI installed"
else
    print_status "Google Cloud CLI already installed"
fi

# VS Code (essential for development)
if ! command_exists code; then
    print_info "Installing Visual Studio Code..."
    if [[ "$OS" == "mac" ]]; then
        brew install --cask visual-studio-code
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
            sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
            sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
            sudo apt update
            sudo apt install code -y
        fi
    fi
    print_status "VS Code installed"
else
    print_status "VS Code already installed"
fi

# Configure npm for user-level global packages
print_header "📦 Configuring npm and installing Firebase tools..."

# Set npm to use user directory for global packages
npm config set prefix "$HOME/.npm-global"

# Add npm global bin to PATH for current session
export PATH="$HOME/.npm-global/bin:$PATH"

# Install Firebase CLI and essential tools
print_info "Installing Firebase CLI, TypeScript, and debugging tools..."
npm install -g firebase-tools typescript ts-node @firebase/app @firebase/ai --force

# Verify Firebase installation
if command_exists firebase; then
    print_status "Firebase CLI installed successfully"
else
    print_warning "Firebase CLI installation may have failed"
fi

# Configure Git for Parserator development
print_header "⚙️ Configuring Git for Parserator..."
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
print_status "Git configured for Parserator development"

# Create projects directory
PROJECTS_DIR="$HOME/parserator-development"
if [ ! -d "$PROJECTS_DIR" ]; then
    mkdir -p "$PROJECTS_DIR"
    print_status "Created projects directory: $PROJECTS_DIR"
else
    print_status "Projects directory already exists: $PROJECTS_DIR"
fi

# Install essential VS Code extensions for Parserator development
print_header "🔌 Installing VS Code extensions for Firebase/API development..."
extensions=(
    "ms-vscode.vscode-github-pullrequest"
    "github.vscode-pull-request-github"
    "ms-vscode.vscode-typescript-next"
    "bradlc.vscode-tailwindcss"
    "esbenp.prettier-vscode"
    "ms-vscode.vscode-json"
    "redhat.vscode-yaml"
    "ms-vscode.hexeditor"
    "ms-vscode.azure-account"
    "toba.vsfire"
    "googlecloudtools.cloudcode"
    "ms-python.python"
)

for ext in "${extensions[@]}"; do
    code --install-extension "$ext" --force 2>/dev/null || true
done
print_status "VS Code extensions installed"

# Set up Firebase debugging environment variables
print_header "🔥 Setting up Firebase debugging environment..."

# Detect shell
if [[ $SHELL == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ $SHELL == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Add Firebase debugging environment to shell config
cat >> "$SHELL_RC" << 'EOF'

# Parserator Development Environment
export PATH="$HOME/.npm-global/bin:$PATH"

# Firebase debugging environment
export FUNCTIONS_DISCOVERY_TIMEOUT=120
export FIREBASE_DEBUG=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Parserator Project Aliases
alias pd='cd ~/parserator-development'
alias parserator='cd ~/parserator-development/parserator-launch-ready'
alias api='cd ~/parserator-development/parserator-launch-ready/packages/api'
alias build='npm run build'
alias deploy='firebase-deploy-debug'
alias test-api='parserator-test'
alias logs='firebase functions:log --limit 20'
alias finfo='firebase-info'
alias deps='analyze-deps'

# Enhanced commands for debugging
alias ll='ls -alF'
alias la='ls -A'
alias grep='rg'
alias find='fd'

# Parserator status function
parserator-status() {
    echo "🔍 Parserator API Status Check"
    echo "============================="
    
    echo "Production API Health:"
    curl -s "https://app-5108296280.us-central1.run.app/health" | jq . || echo "❌ API not responding"
    
    echo ""
    echo "Security Test (fake key should fail):"
    curl -s -X POST "https://app-5108296280.us-central1.run.app/v1/parse" \
      -H "X-API-Key: pk_test_fake_key_12345" \
      -H "Content-Type: application/json" \
      -d '{"inputData": "test", "outputSchema": {"data": "string"}}' | \
      head -100
}

# Firebase deployment with enhanced debugging
firebase-deploy-enhanced() {
    echo "🚀 Enhanced Firebase Deployment"
    echo "==============================="
    
    cd ~/parserator-development/parserator-launch-ready/packages/api
    
    echo "Pre-deployment checks:"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Firebase CLI: $(firebase --version)"
    echo ""
    
    # Build first
    echo "Building..."
    npm run build
    
    # Try deployment with enhanced timeout and error handling
    echo "Deploying with extended timeout..."
    FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:app --debug || {
        echo "❌ First deployment attempt failed, trying again..."
        sleep 5
        FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:app --force
    }
}

# Quick clone function for Parserator
clone-parserator() {
    cd ~/parserator-development
    if [ ! -d "parserator-launch-ready" ]; then
        git clone https://github.com/Domusgpt/parserator.git parserator-launch-ready
        cd parserator-launch-ready
        echo "Parserator cloned and ready!"
        echo "Run: api && npm install"
    else
        echo "Parserator already exists. Use: parserator"
    fi
}
EOF

print_status "Firebase debugging environment configured"

# Create enhanced Firebase debugging utilities
print_header "🛠️ Creating Firebase debugging utilities..."

# Enhanced Firebase deploy script
cat > "$HOME/.npm-global/bin/firebase-deploy-debug" << 'EOF'
#!/bin/bash
echo "🚀 Enhanced Firebase Deployment Debug Script"
echo "============================================="

# Check environment
echo "Environment Check:"
echo "Project: $(firebase use 2>/dev/null || echo 'Not set')"
echo "Node Version: $(node --version)"
echo "Firebase CLI: $(firebase --version)"
echo "Current Dir: $(pwd)"
echo ""

# Check for common issues
echo "🔍 Pre-deployment checks:"

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "   Main: $(cat package.json | grep '"main"' | cut -d'"' -f4)"
    echo "   Node: $(cat package.json | grep '"node"' | cut -d'"' -f4)"
else
    echo "❌ package.json not found"
fi

# Check for multiple index files (common cause of timeout)
echo ""
echo "🔍 Checking for conflicting index files..."
find . -name "index*.ts" -o -name "index*.js" | grep -v node_modules | head -10

# Check built files
echo ""
echo "🔍 Checking built files..."
if [ -d "lib" ]; then
    echo "✅ lib directory exists"
    ls -la lib/index.* 2>/dev/null || echo "❌ No index files in lib"
else
    echo "❌ lib directory not found - run 'npm run build' first"
fi

echo ""
echo "🚀 Starting deployment with extended timeout..."
echo "Timeout set to: ${FUNCTIONS_DISCOVERY_TIMEOUT:-120} seconds"

# Try deployment with enhanced settings
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions --debug
EOF

chmod +x "$HOME/.npm-global/bin/firebase-deploy-debug"

# API testing utility
cat > "$HOME/.npm-global/bin/parserator-test" << 'EOF'
#!/bin/bash

BASE_URL="https://app-5108296280.us-central1.run.app"

echo "🧪 Parserator API Test Suite"
echo "============================"

# Test 1: Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq . 2>/dev/null || echo "❌ Failed or invalid JSON"
echo ""

# Test 2: API Info
echo "2. API Info:"
curl -s "$BASE_URL/v1/info" | jq . 2>/dev/null || echo "❌ Failed or endpoint not found"
echo ""

# Test 3: Anonymous Parsing
echo "3. Anonymous Parsing Test:"
curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{"inputData": "John Smith CEO john@test.com", "outputSchema": {"name": "string", "title": "string", "email": "string"}}' | \
  jq . 2>/dev/null || echo "❌ Failed or endpoint not found"
echo ""

# Test 4: Security Test - Fake API Key (should fail after security fix)
echo "4. 🔒 Security Test - Fake API Key (should be rejected):"
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_fake_key_12345" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}')

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "✅ Security working - fake key rejected"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo "🚨 SECURITY LEAK - fake key may be accepted!"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 5: Format Validation
echo "5. API Key Format Validation:"
curl -s -X POST "$BASE_URL/v1/parse" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_format" \
  -d '{"inputData": "test", "outputSchema": {"data": "string"}}' | \
  jq . 2>/dev/null || echo "❌ Failed or endpoint not found"
echo ""

echo "🏁 Test suite complete!"
echo ""
echo "💡 If endpoints return 404, the full API may not be deployed yet."
echo "   Current deployment appears to be a minimal test function."
EOF

chmod +x "$HOME/.npm-global/bin/parserator-test"

# Firebase project info utility
cat > "$HOME/.npm-global/bin/firebase-info" << 'EOF'
#!/bin/bash

echo "🔥 Firebase Project Information"
echo "==============================="

echo "Current Project: $(firebase use 2>/dev/null || echo 'Not set')"
echo "Available Projects:"
firebase projects:list 2>/dev/null || echo "❌ Not authenticated or no access"

echo ""
echo "Firebase Functions Status:"
firebase functions:list 2>/dev/null || echo "❌ No functions or not authenticated"

echo ""
echo "Recent Logs (last 10):"
firebase functions:log --limit 10 2>/dev/null || echo "❌ Cannot access logs"

echo ""
echo "Environment Config:"
firebase functions:config:get 2>/dev/null || echo "❌ No config or not authenticated"
EOF

chmod +x "$HOME/.npm-global/bin/firebase-info"

# Dependency analyzer
cat > "$HOME/.npm-global/bin/analyze-deps" << 'EOF'
#!/bin/bash

echo "📦 Dependency Analysis for Firebase Functions"
echo "============================================="

if [ -f "package.json" ]; then
    echo "📋 Dependencies:"
    cat package.json | jq '.dependencies' 2>/dev/null || echo "❌ Cannot parse package.json"
    
    echo ""
    echo "🔍 Heavy Dependencies (Firebase deployment timeout risks):"
    
    # Check for known problematic dependencies
    HEAVY_DEPS=("@google/generative-ai" "@tensorflow" "opencv" "sharp" "canvas" "puppeteer" "playwright")
    
    for dep in "${HEAVY_DEPS[@]}"; do
        if cat package.json | grep -q "\"$dep\""; then
            echo "⚠️  Found: $dep (may cause deployment timeout)"
        fi
    done
    
    echo ""
    echo "💡 Node Modules Size:"
    if [ -d "node_modules" ]; then
        du -sh node_modules 2>/dev/null || echo "Cannot calculate size"
    else
        echo "node_modules not found"
    fi
    
    echo ""
    echo "📁 Build Output Size:"
    if [ -d "lib" ]; then
        du -sh lib 2>/dev/null || echo "Cannot calculate size"
        echo "Files in lib/:"
        ls -la lib/ 2>/dev/null || echo "Cannot list files"
    else
        echo "lib directory not found"
    fi
else
    echo "❌ package.json not found"
fi

echo ""
echo "🔧 Optimization suggestions:"
echo "• Use dynamic imports for heavy dependencies"
echo "• Consider @firebase/ai instead of @google/generative-ai"
echo "• Remove unused dependencies"
echo "• Use .npmignore to exclude dev files"
EOF

chmod +x "$HOME/.npm-global/bin/analyze-deps"

# Create quick start script
cat > "$PROJECTS_DIR/parserator-quickstart.sh" << 'EOF'
#!/bin/bash
# Parserator Quick Start Script for Jules

echo "🚀 Starting Parserator development environment..."

# Navigate to development directory
cd ~/parserator-development

# Clone if not exists
if [ ! -d "parserator-launch-ready" ]; then
    echo "📦 Cloning Parserator repository..."
    git clone https://github.com/Domusgpt/parserator.git parserator-launch-ready
fi

cd parserator-launch-ready

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd packages/api
npm install

# Build project
echo "🔨 Building project..."
npm run build

# Open in VS Code
echo "💻 Opening in VS Code..."
code ~/parserator-development/parserator-launch-ready

# Show current status
echo "📊 Current API status:"
parserator-status

echo ""
echo "✅ Parserator development environment ready!"
echo ""
echo "Useful commands:"
echo "parserator-status     - Check API health and security"
echo "firebase-deploy-enhanced - Deploy with debugging"
echo "parserator-test       - Test API endpoints"
echo "firebase-info         - Project information"
echo "analyze-deps          - Check dependencies"
EOF

chmod +x "$PROJECTS_DIR/parserator-quickstart.sh"

# Create environment verification script
cat > "$PROJECTS_DIR/verify-parserator-setup.sh" << 'EOF'
#!/bin/bash
# Parserator Environment Verification

# Add npm global bin to PATH for verification
export PATH="$HOME/.npm-global/bin:$PATH"

echo "🧪 Parserator Development Environment Verification"
echo "=================================================="

# Check core tools
echo "Core Tools:"
git --version 2>/dev/null && echo "✅ Git" || echo "❌ Git"
gh --version 2>/dev/null && echo "✅ GitHub CLI" || echo "❌ GitHub CLI"
node --version 2>/dev/null && echo "✅ Node.js" || echo "❌ Node.js"
code --version 2>/dev/null && echo "✅ VS Code" || echo "❌ VS Code"
gcloud version 2>/dev/null | head -1 && echo "✅ Google Cloud CLI" || echo "❌ Google Cloud CLI"

# Check debugging tools
echo ""
echo "Debugging Tools:"
jq --version 2>/dev/null && echo "✅ jq" || echo "❌ jq"
rg --version 2>/dev/null && echo "✅ ripgrep" || echo "❌ ripgrep"
tree --version 2>/dev/null && echo "✅ tree" || echo "❌ tree"

# Check Firebase tools
echo ""
echo "Firebase Tools:"
firebase --version 2>/dev/null && echo "✅ Firebase CLI" || echo "❌ Firebase CLI"
firebase-deploy-debug 2>/dev/null | head -1 && echo "✅ Enhanced deploy script" || echo "❌ Enhanced deploy script"
parserator-test 2>/dev/null | head -1 && echo "✅ API test script" || echo "❌ API test script"

# Check npm configuration
echo ""
echo "NPM Configuration:"
npm config get prefix | grep -q "$HOME/.npm-global" && echo "✅ NPM user-level config" || echo "❌ NPM user-level config"

# Check environment variables
echo ""
echo "Environment Variables:"
echo "FUNCTIONS_DISCOVERY_TIMEOUT: ${FUNCTIONS_DISCOVERY_TIMEOUT:-Not set}"
echo "FIREBASE_DEBUG: ${FIREBASE_DEBUG:-Not set}"
echo "NODE_OPTIONS: ${NODE_OPTIONS:-Not set}"

# Check project setup
echo ""
echo "Project Setup:"
[ -d ~/parserator-development ] && echo "✅ Development directory" || echo "❌ Development directory"
[ -d ~/parserator-development/parserator-launch-ready ] && echo "✅ Parserator repository" || echo "❌ Parserator repository"

# Check authentication
echo ""
echo "Authentication Status:"
gh auth status 2>/dev/null && echo "✅ GitHub authenticated" || echo "❌ GitHub not authenticated"
firebase projects:list 2>/dev/null >/dev/null && echo "✅ Firebase authenticated" || echo "❌ Firebase not authenticated"
gcloud auth list 2>/dev/null | grep -q ACTIVE && echo "✅ Google Cloud authenticated" || echo "❌ Google Cloud not authenticated"

echo ""
echo "🚀 Quick start: run ~/parserator-development/parserator-quickstart.sh"
EOF

chmod +x "$PROJECTS_DIR/verify-parserator-setup.sh"

# Verification tests
print_header "🧪 Running verification tests..."

# Test core installations
tests=(
    "git --version:Git"
    "gh --version:GitHub CLI"
    "node --version:Node.js"
    "code --version:VS Code"
    "npm --version:NPM"
    "jq --version:jq"
    "rg --version:ripgrep"
)

export PATH="$HOME/.npm-global/bin:$PATH"

for test in "${tests[@]}"; do
    cmd="${test%%:*}"
    name="${test##*:}"
    if $cmd >/dev/null 2>&1; then
        version=$($cmd 2>/dev/null | head -n1)
        print_status "$name: $version"
    else
        print_error "$name: Not installed or not in PATH"
    fi
done

print_header "🎯 PARSERATOR SETUP COMPLETE!"
echo ""
print_info "Jules' Parserator development environment is ready!"
echo ""
print_warning "IMPORTANT: Complete these manual steps:"
echo "1. 🔄 RESTART your terminal (required for environment variables)"
echo "2. 🔐 Authenticate services:"
echo "   gh auth login"
echo "   firebase login"
echo "   gcloud auth login"
echo "3. 👤 Configure Git identity:"
echo "   git config --global user.name 'Jules [LastName]'"
echo "   git config --global user.email 'jules@[domain].com'"
echo ""
print_info "After restart, verify with:"
echo "• $PROJECTS_DIR/verify-parserator-setup.sh"
echo ""
print_info "Quick start Parserator development:"
echo "• $PROJECTS_DIR/parserator-quickstart.sh"
echo ""
print_info "Essential aliases (available after restart):"
echo "• parserator        - Go to Parserator project"
echo "• api              - Go to API directory"
echo "• parserator-status - Check API health & security"
echo "• firebase-deploy-enhanced - Deploy with debugging"
echo "• parserator-test   - Test all API endpoints"
echo ""
print_header "🔥 Firebase deployment timeout fixes included!"
print_info "The environment is configured with:"
echo "• Extended discovery timeout (120s)"
echo "• Debug mode enabled"
echo "• Memory optimization"
echo "• Double-deploy fallback strategy"
echo "• Dependency analysis tools"
echo ""
print_warning "If you need additional tools, let Paul know:"
echo "• Advanced bundling tools (webpack, rollup)"
echo "• Docker for containerized development"
echo "• Database management tools"
echo "• Additional Google Cloud services"
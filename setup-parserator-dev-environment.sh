#!/bin/bash

# 🚀 PARSERATOR DEVELOPMENT ENVIRONMENT SETUP SCRIPT
# Comprehensive setup for optimal development experience
# Run this script to get the complete development environment ready

set -e

echo "🚀 Setting up Parserator Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on WSL/Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_step "Detected Linux/WSL environment"
    PACKAGE_MANAGER="apt"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_step "Detected macOS environment"
    PACKAGE_MANAGER="brew"
else
    print_warning "Unsupported OS. This script is optimized for Linux/WSL and macOS"
    exit 1
fi

# 1. UPDATE SYSTEM
print_step "Updating system packages..."
if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
elif [[ "$PACKAGE_MANAGER" == "brew" ]]; then
    brew update
    xcode-select --install 2>/dev/null || true
fi
print_success "System packages updated"

# 2. INSTALL NODE.JS & NPM (Latest LTS)
print_step "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$PACKAGE_MANAGER" == "brew" ]]; then
        brew install node
    fi
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install/update npm to latest
npm install -g npm@latest
print_success "Node.js and npm ready: Node $(node --version), npm $(npm --version)"

# 3. INSTALL YARN (Alternative package manager)
print_step "Installing Yarn package manager..."
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
fi
print_success "Yarn installed: $(yarn --version)"

# 4. INSTALL PNPM (Fast package manager)
print_step "Installing pnpm (fast package manager)..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
print_success "pnpm installed: $(pnpm --version)"

# 5. INSTALL TYPESCRIPT & DEVELOPMENT TOOLS
print_step "Installing TypeScript and development tools..."
npm install -g typescript ts-node tsx nodemon concurrently
npm install -g @types/node
print_success "TypeScript tools installed: $(tsc --version)"

# 6. INSTALL FIREBASE CLI
print_step "Installing Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    npm install -g firebase-tools
fi
print_success "Firebase CLI installed: $(firebase --version)"

# 7. INSTALL GOOGLE CLOUD CLI (for advanced Firebase features)
print_step "Installing Google Cloud CLI..."
if ! command -v gcloud &> /dev/null; then
    if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
        curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
        echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
        sudo apt-get update && sudo apt-get install google-cloud-cli
    elif [[ "$PACKAGE_MANAGER" == "brew" ]]; then
        brew install --cask google-cloud-sdk
    fi
fi
print_success "Google Cloud CLI ready"

# 8. INSTALL DOCKER & DOCKER COMPOSE
print_step "Installing Docker..."
if ! command -v docker &> /dev/null; then
    if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    elif [[ "$PACKAGE_MANAGER" == "brew" ]]; then
        brew install --cask docker
    fi
fi
print_success "Docker installed"

# 9. INSTALL DEVELOPMENT UTILITIES
print_step "Installing development utilities..."

# HTTP client tools
npm install -g @nestjs/cli
npm install -g @angular/cli 2>/dev/null || true
npm install -g create-react-app 2>/dev/null || true

# Testing frameworks
npm install -g jest @jest/core
npm install -g mocha chai supertest

# Code quality tools
npm install -g eslint prettier
npm install -g @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Documentation tools
npm install -g @apidevtools/swagger-parser
npm install -g redoc-cli

# Process management
npm install -g pm2

# JSON/API tools
npm install -g json-server
npm install -g newman # Postman CLI

print_success "Development utilities installed"

# 10. INSTALL TURBO (Monorepo management)
print_step "Installing Turbo for monorepo management..."
npm install -g turbo
print_success "Turbo installed: $(turbo --version)"

# 11. INSTALL VS CODE EXTENSIONS (if VS Code is available)
print_step "Setting up VS Code extensions..."
if command -v code &> /dev/null; then
    code --install-extension ms-vscode.vscode-typescript-next
    code --install-extension esbenp.prettier-vscode
    code --install-extension ms-vscode.vscode-eslint
    code --install-extension ms-vscode.vscode-json
    code --install-extension bradlc.vscode-tailwindcss
    code --install-extension ms-vscode.vscode-jest
    code --install-extension Firebase.firebase-vscode
    code --install-extension ms-vscode.vscode-docker
    code --install-extension streetsidesoftware.code-spell-checker
    code --install-extension ms-vscode.vscode-thunder-client
    code --install-extension redhat.vscode-yaml
    code --install-extension ms-vscode.vscode-gitignore
    print_success "VS Code extensions installed"
else
    print_warning "VS Code not found. Install VS Code and run the extension commands manually"
fi

# 12. CREATE DEVELOPMENT DIRECTORIES
print_step "Creating development directory structure..."
mkdir -p ~/parserator-dev/{projects,tools,backups,docs,tests}
mkdir -p ~/parserator-dev/tools/{scripts,configs,templates}
print_success "Directory structure created"

# 13. INSTALL PARSERATOR-SPECIFIC TOOLS
print_step "Installing Parserator-specific development tools..."

# LLM and AI development tools
npm install -g @google/generative-ai
npm install -g openai

# API testing and development
npm install -g insomnia-cli
npm install -g @apidevtools/swagger-cli

# Database tools for Firestore
npm install -g @google-cloud/firestore

# Performance monitoring
npm install -g clinic
npm install -g autocannon

print_success "Parserator-specific tools installed"

# 14. SETUP GIT CONFIGURATION
print_step "Configuring Git for development..."
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global core.autocrlf input
git config --global user.name "Claude-Parserator-Dev" 2>/dev/null || true
git config --global user.email "dev@parserator.com" 2>/dev/null || true

# Create useful Git aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.lg "log --oneline --graph --decorate"
git config --global alias.unstage "reset HEAD --"

print_success "Git configured with useful aliases"

# 15. CREATE DEVELOPMENT HELPER SCRIPTS
print_step "Creating development helper scripts..."

# Create parserator-dev helper script
cat > ~/parserator-dev/tools/scripts/parserator-dev.sh << 'EOF'
#!/bin/bash
# Parserator Development Helper Script

case "$1" in
    "start")
        echo "🚀 Starting Parserator development environment..."
        cd /mnt/c/Users/millz/parserator-launch-ready
        npm run dev
        ;;
    "test")
        echo "🧪 Running Parserator tests..."
        cd /mnt/c/Users/millz/parserator-launch-ready
        npm test
        ;;
    "build")
        echo "🔨 Building Parserator..."
        cd /mnt/c/Users/millz/parserator-launch-ready
        npm run build
        ;;
    "deploy")
        echo "🚀 Deploying Parserator..."
        cd /mnt/c/Users/millz/parserator-launch-ready
        firebase deploy
        ;;
    "logs")
        echo "📋 Viewing Parserator logs..."
        firebase functions:log
        ;;
    "shell")
        echo "🐚 Starting Parserator shell..."
        cd /mnt/c/Users/millz/parserator-launch-ready
        firebase functions:shell
        ;;
    "backup")
        echo "💾 Creating backup..."
        timestamp=$(date +"%Y%m%d_%H%M%S")
        cp -r /mnt/c/Users/millz/parserator-launch-ready ~/parserator-dev/backups/parserator_backup_$timestamp
        echo "Backup created: ~/parserator-dev/backups/parserator_backup_$timestamp"
        ;;
    *)
        echo "Parserator Development Helper"
        echo "Usage: parserator-dev {start|test|build|deploy|logs|shell|backup}"
        ;;
esac
EOF

chmod +x ~/parserator-dev/tools/scripts/parserator-dev.sh

# Create API testing script
cat > ~/parserator-dev/tools/scripts/test-api.sh << 'EOF'
#!/bin/bash
# Quick API testing script for Parserator

API_URL="${PARSERATOR_API_URL:-https://app-5108296280.us-central1.run.app}"

echo "🧪 Testing Parserator API..."
echo "API URL: $API_URL"

# Test health endpoint
echo "Testing health endpoint..."
curl -s "$API_URL/health" | jq '.' || echo "Health check failed"

# Test info endpoint
echo "Testing info endpoint..."
curl -s "$API_URL/v1/info" | jq '.' || echo "Info check failed"

echo "✅ API tests completed"
EOF

chmod +x ~/parserator-dev/tools/scripts/test-api.sh

# Create project setup script
cat > ~/parserator-dev/tools/scripts/setup-project.sh << 'EOF'
#!/bin/bash
# Setup a new Parserator project instance

PROJECT_NAME="$1"
if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: setup-project.sh <project-name>"
    exit 1
fi

echo "🔧 Setting up new Parserator project: $PROJECT_NAME"

# Create project directory
mkdir -p ~/parserator-dev/projects/$PROJECT_NAME
cd ~/parserator-dev/projects/$PROJECT_NAME

# Copy template files
cp -r /mnt/c/Users/millz/parserator-launch-ready/packages ~/parserator-dev/projects/$PROJECT_NAME/
cp /mnt/c/Users/millz/parserator-launch-ready/package.json ~/parserator-dev/projects/$PROJECT_NAME/
cp /mnt/c/Users/millz/parserator-launch-ready/turbo.json ~/parserator-dev/projects/$PROJECT_NAME/

# Install dependencies
npm install

echo "✅ Project $PROJECT_NAME setup completed"
EOF

chmod +x ~/parserator-dev/tools/scripts/setup-project.sh

print_success "Development helper scripts created"

# 16. CREATE ENVIRONMENT CONFIGURATION
print_step "Creating environment configuration files..."

# Create development environment file
cat > ~/parserator-dev/tools/configs/.env.development << 'EOF'
# Parserator Development Environment Configuration

# API Configuration
PARSERATOR_API_URL=https://app-5108296280.us-central1.run.app
PARSERATOR_LOCAL_URL=http://localhost:5001

# Firebase Configuration
FIREBASE_PROJECT_ID=parserator-production
FIREBASE_REGION=us-central1

# Development Settings
NODE_ENV=development
DEBUG=parserator:*
LOG_LEVEL=debug

# LLM Configuration
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Testing Configuration
TEST_TIMEOUT=30000
TEST_PARALLEL=false

# Development Features
ENABLE_HOT_RELOAD=true
ENABLE_SOURCE_MAPS=true
ENABLE_PROFILING=true
EOF

# Create VS Code settings
mkdir -p ~/parserator-dev/tools/configs/vscode
cat > ~/parserator-dev/tools/configs/vscode/settings.json << 'EOF'
{
    "typescript.preferences.organizeImports": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true,
        "source.organizeImports": true
    },
    "files.associations": {
        "*.ts": "typescript",
        "*.js": "javascript"
    },
    "emmet.includeLanguages": {
        "typescript": "html",
        "javascript": "html"
    },
    "jest.autoRun": "watch",
    "typescript.updateImportsOnFileMove.enabled": "always",
    "editor.rulers": [80, 120],
    "files.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/lib": true,
        "**/.next": true
    }
}
EOF

print_success "Configuration files created"

# 17. SETUP DEVELOPMENT ALIASES
print_step "Setting up development aliases..."

# Add aliases to bashrc/zshrc
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    cat >> "$SHELL_RC" << 'EOF'

# Parserator Development Aliases
alias parserator-dev='~/parserator-dev/tools/scripts/parserator-dev.sh'
alias parserator-test='~/parserator-dev/tools/scripts/test-api.sh'
alias parserator-setup='~/parserator-dev/tools/scripts/setup-project.sh'
alias pd='cd /mnt/c/Users/millz/parserator-launch-ready'
alias pdev='cd ~/parserator-dev'
alias plog='firebase functions:log --project parserator-production'
alias pshell='firebase functions:shell --project parserator-production'

# Quick development commands
alias nr='npm run'
alias nrd='npm run dev'
alias nrb='npm run build'
alias nrt='npm run test'
alias nrl='npm run lint'

# Git aliases for parserator
alias gst='git status'
alias gco='git checkout'
alias gcm='git commit -m'
alias gps='git push'
alias gpl='git pull'
alias glg='git log --oneline --graph --decorate'

# Firebase aliases
alias fbd='firebase deploy'
alias fbl='firebase functions:log'
alias fbs='firebase serve'
alias fbe='firebase emulators:start'

EOF
    print_success "Development aliases added to $SHELL_RC"
else
    print_warning "Could not detect shell. Add aliases manually."
fi

# 18. INSTALL PERFORMANCE MONITORING TOOLS
print_step "Installing performance monitoring tools..."
npm install -g @google-cloud/profiler
npm install -g clinic bubbleprof flamegraph
npm install -g 0x
print_success "Performance monitoring tools installed"

# 19. CREATE DEVELOPMENT DOCUMENTATION
print_step "Creating development documentation..."

cat > ~/parserator-dev/docs/DEVELOPMENT_GUIDE.md << 'EOF'
# 🚀 Parserator Development Guide

## Quick Start Commands

```bash
# Start development environment
parserator-dev start

# Test the API
parserator-dev test

# Build the project
parserator-dev build

# Deploy to Firebase
parserator-dev deploy

# View logs
parserator-dev logs

# Create backup
parserator-dev backup
```

## Development Workflow

1. **Start Development**: `parserator-dev start`
2. **Make Changes**: Edit files in `/mnt/c/Users/millz/parserator-launch-ready`
3. **Test Changes**: `parserator-dev test`
4. **Build Project**: `parserator-dev build`
5. **Deploy**: `parserator-dev deploy`

## Project Structure

- `~/parserator-dev/projects/` - Development projects
- `~/parserator-dev/tools/` - Development tools and scripts
- `~/parserator-dev/backups/` - Project backups
- `~/parserator-dev/docs/` - Documentation

## Useful Commands

```bash
# Navigate to main project
pd

# Navigate to dev folder
pdev

# Quick npm commands
nr dev     # npm run dev
nr build   # npm run build
nr test    # npm run test

# Firebase commands
fbd        # firebase deploy
fbl        # firebase functions:log
fbe        # firebase emulators:start
```

## Environment Configuration

Edit `~/parserator-dev/tools/configs/.env.development` to configure:
- API URLs
- Firebase settings
- LLM API keys
- Development features

## Troubleshooting

1. **Permission Issues**: Run with `sudo` if needed
2. **Path Issues**: Ensure scripts are executable: `chmod +x script.sh`
3. **Node Issues**: Restart terminal after Node.js installation
4. **Firebase Issues**: Run `firebase login` to authenticate

## Performance Monitoring

- Use `clinic` for Node.js performance analysis
- Use `0x` for flame graphs
- Use `autocannon` for load testing

## VS Code Setup

Import settings from: `~/parserator-dev/tools/configs/vscode/settings.json`
EOF

print_success "Development documentation created"

# 20. FINAL SETUP AND VERIFICATION
print_step "Running final verification..."

echo "🔍 Verifying installation..."
echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not found')"
echo "TypeScript: $(tsc --version 2>/dev/null || echo 'Not found')"
echo "Firebase CLI: $(firebase --version 2>/dev/null || echo 'Not found')"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not found')"
echo "Git: $(git --version 2>/dev/null || echo 'Not found')"

# 21. COMPLETION MESSAGE
echo ""
echo "🎉 PARSERATOR DEVELOPMENT ENVIRONMENT SETUP COMPLETE!"
echo "=================================================="
echo ""
echo "📋 What was installed:"
echo "  ✅ Node.js & npm (latest LTS)"
echo "  ✅ TypeScript & development tools"
echo "  ✅ Firebase CLI & Google Cloud CLI"
echo "  ✅ Docker & Docker Compose"
echo "  ✅ Development utilities (Jest, ESLint, Prettier)"
echo "  ✅ Turbo for monorepo management"
echo "  ✅ VS Code extensions"
echo "  ✅ Performance monitoring tools"
echo ""
echo "📁 Development structure created:"
echo "  📂 ~/parserator-dev/projects/   - Development projects"
echo "  📂 ~/parserator-dev/tools/      - Development tools & scripts"
echo "  📂 ~/parserator-dev/backups/    - Project backups"
echo "  📂 ~/parserator-dev/docs/       - Documentation"
echo ""
echo "🛠️  Helper commands available:"
echo "  parserator-dev start    - Start development environment"
echo "  parserator-dev test     - Test the API"
echo "  parserator-dev build    - Build the project"
echo "  parserator-dev deploy   - Deploy to Firebase"
echo "  pd                      - Navigate to main project"
echo "  pdev                    - Navigate to dev folder"
echo ""
echo "📖 Next steps:"
echo "  1. Restart your terminal or run: source ~/.bashrc"
echo "  2. Navigate to project: pd"
echo "  3. Set up environment variables in: ~/parserator-dev/tools/configs/.env.development"
echo "  4. Start development: parserator-dev start"
echo "  5. Read the guide: ~/parserator-dev/docs/DEVELOPMENT_GUIDE.md"
echo ""
echo "🔗 Useful links:"
echo "  - Main project: /mnt/c/Users/millz/parserator-launch-ready"
echo "  - Development guide: ~/parserator-dev/docs/DEVELOPMENT_GUIDE.md"
echo "  - Configuration: ~/parserator-dev/tools/configs/.env.development"
echo ""
print_success "Ready to develop! 🚀"

# Note about restarting terminal
echo ""
print_warning "IMPORTANT: Restart your terminal or run 'source ~/.bashrc' to use the new aliases!"
echo ""
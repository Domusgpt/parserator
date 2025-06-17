#!/bin/bash

# 🚀 QUICK PARSERATOR DEVELOPMENT SETUP
# Essential tools only - for immediate development needs

set -e

echo "⚡ Quick Parserator Development Setup..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Essential Node.js tools
print_step "Installing essential Node.js development tools..."
npm install -g typescript ts-node tsx nodemon
npm install -g firebase-tools
npm install -g turbo
npm install -g jest eslint prettier
print_success "Essential tools installed"

# 2. Install project dependencies
print_step "Installing project dependencies..."
cd /mnt/c/Users/millz/parserator-launch-ready
npm install
print_success "Project dependencies installed"

# 3. Create quick aliases
print_step "Setting up quick development aliases..."

# Add to bashrc if it exists
if [ -f ~/.bashrc ]; then
    cat >> ~/.bashrc << 'EOF'

# Quick Parserator Development Aliases
alias pd='cd /mnt/c/Users/millz/parserator-launch-ready'
alias pstart='cd /mnt/c/Users/millz/parserator-launch-ready && npm run dev'
alias ptest='cd /mnt/c/Users/millz/parserator-launch-ready && npm test'
alias pbuild='cd /mnt/c/Users/millz/parserator-launch-ready && npm run build'
alias pdeploy='cd /mnt/c/Users/millz/parserator-launch-ready && firebase deploy'
alias plog='firebase functions:log --project parserator-production'

EOF
    print_success "Aliases added to ~/.bashrc"
fi

# 4. Create quick development helper
cat > /mnt/c/Users/millz/parserator-launch-ready/dev.sh << 'EOF'
#!/bin/bash
# Quick development helper for Parserator

case "$1" in
    "start"|"dev")
        echo "🚀 Starting Parserator development server..."
        npm run dev
        ;;
    "test")
        echo "🧪 Running tests..."
        npm test
        ;;
    "build")
        echo "🔨 Building project..."
        npm run build
        ;;
    "deploy")
        echo "🚀 Deploying to Firebase..."
        firebase deploy
        ;;
    "logs")
        echo "📋 Viewing logs..."
        firebase functions:log --project parserator-production
        ;;
    "install")
        echo "📦 Installing dependencies..."
        npm install
        ;;
    "clean")
        echo "🧹 Cleaning project..."
        rm -rf node_modules package-lock.json
        npm install
        ;;
    "prompts")
        echo "🔧 Updating to sophisticated prompts..."
        echo "Check SOPHISTICATED_PROMPTS_RECONSTRUCTION.md for implementation"
        ;;
    *)
        echo "Parserator Development Helper"
        echo "Usage: ./dev.sh {start|test|build|deploy|logs|install|clean|prompts}"
        echo ""
        echo "Commands:"
        echo "  start/dev  - Start development server"
        echo "  test       - Run tests"
        echo "  build      - Build project"
        echo "  deploy     - Deploy to Firebase"
        echo "  logs       - View Firebase logs"
        echo "  install    - Install dependencies"
        echo "  clean      - Clean and reinstall dependencies"
        echo "  prompts    - Info about sophisticated prompts"
        ;;
esac
EOF

chmod +x /mnt/c/Users/millz/parserator-launch-ready/dev.sh
print_success "Development helper created: ./dev.sh"

# 5. Quick environment check
print_step "Checking development environment..."
echo "Node.js: $(node --version 2>/dev/null || echo '❌ Not found - install Node.js')"
echo "npm: $(npm --version 2>/dev/null || echo '❌ Not found')"
echo "TypeScript: $(tsc --version 2>/dev/null || echo '❌ Not found')"
echo "Firebase CLI: $(firebase --version 2>/dev/null || echo '❌ Not found')"

echo ""
echo "🎉 Quick Setup Complete!"
echo "======================="
echo ""
echo "🚀 Quick commands:"
echo "  ./dev.sh start     - Start development"
echo "  ./dev.sh test      - Run tests"
echo "  ./dev.sh build     - Build project"
echo "  ./dev.sh deploy    - Deploy"
echo ""
echo "🔗 Or use aliases after restarting terminal:"
echo "  pd          - Navigate to project"
echo "  pstart      - Start development"
echo "  ptest       - Run tests"
echo "  pbuild      - Build project"
echo "  pdeploy     - Deploy"
echo ""
echo "📋 Next steps:"
echo "  1. Restart terminal or run: source ~/.bashrc"
echo "  2. Start development: ./dev.sh start"
echo "  3. Check SOPHISTICATED_PROMPTS_RECONSTRUCTION.md to upgrade prompts"
echo ""
print_success "Ready to code! 🚀"
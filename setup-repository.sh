#!/bin/bash

# Parserator Repository Setup Script
# Sets up a new private GitHub repository for Parserator

set -e

echo "🚀 Setting up Parserator private repository..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI (gh) is not installed."
    echo "You'll need to create the repository manually on GitHub."
    echo "Install with: npm install -g @github/cli"
    GH_AVAILABLE=false
else
    GH_AVAILABLE=true
fi

print_status "Initializing git repository..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Create initial commit if no commits exist
if ! git rev-parse HEAD >/dev/null 2>&1; then
    print_status "Creating initial commit..."
    
    # Add all files to git
    git add .
    
    # Create initial commit
    git commit -m "feat: initial Parserator implementation

- Implement two-stage Architect-Extractor pattern
- Add Gemini 1.5 Flash integration
- Create production-ready API endpoints
- Add comprehensive TypeScript interfaces
- Include detailed documentation and deployment guides

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    print_success "Initial commit created"
else
    print_status "Repository already has commits"
fi

# Set up main branch
git branch -M main

if [ "$GH_AVAILABLE" = true ]; then
    print_status "Checking GitHub CLI authentication..."
    
    # Check if user is logged in to GitHub CLI
    if ! gh auth status &> /dev/null; then
        print_error "Please login to GitHub CLI first:"
        echo "Run: gh auth login"
        exit 1
    fi
    
    print_status "Creating private GitHub repository..."
    
    # Create private repository
    gh repo create parserator \
        --private \
        --description "Intelligent data parsing for modern operators using the Architect-Extractor pattern" \
        --clone=false \
        --push=false
    
    if [ $? -eq 0 ]; then
        print_success "Private repository created on GitHub"
        
        # Get the repository URL
        REPO_URL=$(gh repo view --json sshUrl -q .sshUrl)
        
        # Add remote origin
        if git remote get-url origin &> /dev/null; then
            print_status "Remote origin already exists, updating..."
            git remote set-url origin "$REPO_URL"
        else
            git remote add origin "$REPO_URL"
        fi
        
        print_success "Remote origin configured: $REPO_URL"
        
        # Push to GitHub
        print_status "Pushing to GitHub..."
        git push -u origin main
        
        print_success "Code pushed to GitHub successfully!"
        
        echo ""
        echo -e "${GREEN}🎉 Repository setup complete!${NC}"
        echo ""
        echo -e "${BLUE}Repository URL:${NC} https://github.com/$(gh api user --jq .login)/parserator"
        echo -e "${BLUE}Clone URL (SSH):${NC} $REPO_URL"
        echo ""
        
    else
        print_error "Failed to create repository on GitHub"
        echo "You may need to create it manually at: https://github.com/new"
    fi
else
    print_warning "GitHub CLI not available. Manual setup required:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a new PRIVATE repository named 'parserator'"
    echo "3. Don't initialize with README (we already have one)"
    echo "4. Copy the SSH URL and run:"
    echo ""
    echo "   git remote add origin git@github.com:yourusername/parserator.git"
    echo "   git push -u origin main"
    echo ""
fi

# Create local development setup
print_status "Setting up local development environment..."

# Create environment template
if [ ! -f ".env.example" ]; then
    cat > .env.example << EOF
# Parserator Environment Configuration

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Development Configuration
NODE_ENV=development
API_VERSION=1.0.0

# Service Limits
MAX_INPUT_SIZE=100000
MAX_SCHEMA_FIELDS=50
DEFAULT_TIMEOUT_MS=60000

# Firebase Configuration (for deployment)
FIREBASE_PROJECT_ID=your_firebase_project_id

# Optional: Advanced Configuration
ENABLE_DETAILED_LOGGING=true
LOG_LEVEL=info
RATE_LIMIT_ENABLED=false
EOF
    print_success "Environment template created (.env.example)"
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
fi

# Install API package dependencies
if [ -f "packages/api/package.json" ]; then
    print_status "Installing API package dependencies..."
    cd packages/api
    npm install
    cd ../..
    print_success "API package dependencies installed"
fi

# Create development scripts
if [ ! -f "dev-setup.sh" ]; then
    cat > dev-setup.sh << 'EOF'
#!/bin/bash

# Development setup script
echo "Setting up Parserator development environment..."

# Copy environment template
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env file from template"
    echo "Please edit .env and add your GEMINI_API_KEY"
fi

# Install Firebase CLI if not present
if ! command -v firebase &> /dev/null; then
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Build the project
echo "Building project..."
cd packages/api
npm run build

echo ""
echo "Development setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your GEMINI_API_KEY"
echo "2. Run 'npm run dev' in packages/api to start development server"
echo "3. Test with: curl http://localhost:5001/parserator/us-central1/api/health"
EOF
    chmod +x dev-setup.sh
    print_success "Development setup script created"
fi

# Create quick test script
if [ ! -f "test-api.sh" ]; then
    cat > test-api.sh << 'EOF'
#!/bin/bash

# Quick API test script
echo "Testing Parserator API..."

# Check if server is running
if ! curl -s http://localhost:5001/parserator/us-central1/api/health &> /dev/null; then
    echo "❌ API server is not running"
    echo "Start with: cd packages/api && npm run dev"
    exit 1
fi

echo "✅ API server is running"

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:5001/parserator/us-central1/api/health | json_pp

echo ""
echo "Testing parse endpoint..."
curl -s -X POST http://localhost:5001/parserator/us-central1/api/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Customer: John Doe\nEmail: john@example.com\nPhone: 555-123-4567",
    "outputSchema": {
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  }' | json_pp

echo ""
echo "Test complete!"
EOF
    chmod +x test-api.sh
    print_success "API test script created"
fi

print_status "Creating documentation index..."

# Create docs index if it doesn't exist
if [ ! -f "docs/README.md" ]; then
    cat > docs/README.md << 'EOF'
# Parserator Documentation

## Quick Navigation

### Core Documentation
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Architecture Guide](./ARCHITECTURE.md) - Technical architecture deep-dive  
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions

### Development Guides
- [Getting Started](../README.md#development) - Local development setup
- [Style Guide](../PARSERATOR_AI_BRIEFING/_supporting_docs/2_style_guide.md) - Coding standards
- [Project Definition](../PARSERATOR_AI_BRIEFING/_supporting_docs/1_project_definition.md) - Business model and technical requirements

### AI Development Context
- [Claude Briefing](../PARSERATOR_AI_BRIEFING/1_claude_briefing.md) - Master briefing for AI development
- [Claude Context](../CLAUDE.md) - Project guidance for Claude Code

## Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| API Documentation | ✅ Complete | Jan 2024 |
| Architecture Guide | ✅ Complete | Jan 2024 |
| Deployment Guide | ✅ Complete | Jan 2024 |
| SDK Documentation | 🔄 In Progress | - |
| Examples & Recipes | 📋 Planned | - |

## Contributing to Documentation

When updating documentation:

1. Keep it practical and actionable
2. Include code examples where relevant
3. Update the status table above
4. Follow the existing style and structure

## External Links

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
EOF
    print_success "Documentation index created"
fi

echo ""
print_success "Repository setup completed successfully!"
echo ""
echo -e "${BLUE}📁 Project Structure:${NC}"
echo "  ├── packages/api/           # Core SaaS API"
echo "  ├── docs/                   # Documentation"
echo "  ├── PARSERATOR_AI_BRIEFING/ # AI development context"
echo "  ├── README.md               # Project overview"
echo "  ├── LICENSE                 # Proprietary license"
echo "  └── .gitignore              # Git ignore rules"
echo ""
echo -e "${BLUE}🛠️  Next Steps:${NC}"
echo "1. Edit .env.example and add your GEMINI_API_KEY"
echo "2. Run ./dev-setup.sh to configure local development"
echo "3. Test the API with ./test-api.sh"
echo "4. Review the documentation in docs/"
echo ""
echo -e "${BLUE}🔐 Important Security Notes:${NC}"
echo "• This is a PRIVATE repository - your IP is protected"
echo "• Never commit API keys or secrets to git"
echo "• Use .env files for local configuration"
echo "• API keys are automatically ignored by .gitignore"
echo ""
echo -e "${GREEN}🎯 Your intelligent data parsing engine is ready to build!${NC}"
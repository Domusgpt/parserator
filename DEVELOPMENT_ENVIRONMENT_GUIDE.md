# 🚀 PARSERATOR DEVELOPMENT ENVIRONMENT GUIDE

## 📋 Complete Development Setup Options

Choose the setup option that best fits your needs:

### 🔥 Option 1: Quick Setup (Recommended for immediate development)
```bash
./quick-dev-setup.sh
```
**What it does:**
- ✅ Installs essential Node.js tools (TypeScript, Firebase CLI, etc.)
- ✅ Sets up project dependencies
- ✅ Creates development helper script (`./dev.sh`)
- ✅ Adds quick command aliases
- ✅ Ready to code in 2 minutes

**Perfect for:** Getting started immediately, testing the sophisticated prompts

### 🌟 Option 2: Full Development Environment
```bash
./setup-parserator-dev-environment.sh
```
**What it does:**
- ✅ Everything from Quick Setup, plus:
- ✅ Docker & container tools
- ✅ Google Cloud CLI
- ✅ Performance monitoring tools (clinic, autocannon)
- ✅ VS Code extensions auto-install
- ✅ Complete development directory structure
- ✅ Advanced Git configuration
- ✅ Documentation and helper scripts
- ✅ Environment configuration templates

**Perfect for:** Long-term development, team collaboration, production deployment

### 🪟 Option 3: Windows Users
```batch
setup-dev-windows.bat
```
**What it does:**
- ✅ Windows-optimized setup
- ✅ PowerShell aliases
- ✅ Windows batch helpers
- ✅ All essential tools for Windows development

**Perfect for:** Windows users who prefer native batch files

## 🛠️ What Gets Installed

### Essential Tools (All Setups)
- **Node.js & npm** - Latest LTS version
- **TypeScript** - With ts-node, tsx for development
- **Firebase CLI** - For deployment and testing
- **Turbo** - Monorepo management
- **Jest** - Testing framework
- **ESLint & Prettier** - Code quality tools

### Advanced Tools (Full Setup Only)
- **Docker** - Containerization
- **Google Cloud CLI** - Advanced Firebase features
- **Performance Tools** - clinic, autocannon, 0x for profiling
- **VS Code Extensions** - Auto-installed development extensions
- **PM2** - Process management
- **Newman** - Postman CLI for API testing

## 🚀 Development Workflow

### 1. Quick Start Commands
```bash
# After any setup, use these commands:
./dev.sh start      # Start development server
./dev.sh test       # Run tests
./dev.sh build      # Build project
./dev.sh deploy     # Deploy to Firebase
./dev.sh logs       # View logs
```

### 2. Terminal Aliases (after restart)
```bash
pd              # Navigate to project directory
pstart          # Start development server
ptest           # Run tests
pbuild          # Build project
pdeploy         # Deploy to Firebase
plog            # View Firebase logs
```

### 3. Advanced Development (Full Setup)
```bash
parserator-dev start    # Enhanced development command
parserator-dev backup   # Create project backup
parserator-setup myapp  # Create new project instance
parserator-test         # Test API endpoints
```

## 📁 Development Structure (Full Setup)

```
~/parserator-dev/
├── projects/           # Development projects
├── tools/
│   ├── scripts/       # Helper scripts
│   └── configs/       # Configuration files
├── backups/           # Project backups
└── docs/             # Development documentation
```

## 🔧 Configuration Files

### Environment Configuration
Edit: `~/parserator-dev/tools/configs/.env.development`
```bash
# API Configuration
PARSERATOR_API_URL=https://app-5108296280.us-central1.run.app
GEMINI_API_KEY=your-key-here

# Development Settings
NODE_ENV=development
DEBUG=parserator:*
```

### VS Code Settings
Location: `~/parserator-dev/tools/configs/vscode/settings.json`
- Auto-formatting on save
- TypeScript optimizations
- Jest integration
- ESLint auto-fix

## 🚀 Implementing Sophisticated Prompts

After setup, implement the advanced prompts:

### Step 1: Review the Reconstruction
```bash
cat SOPHISTICATED_PROMPTS_RECONSTRUCTION.md
```

### Step 2: Update Current Implementation
Replace the basic prompts in `/packages/api/src/index.ts` with the sophisticated versions found in the reconstruction document.

### Step 3: Key Files to Update
- `/packages/api/src/index.ts` - Main API with prompts
- Add error recovery logic from the reconstruction
- Implement contextual error generation

### Step 4: Test the Changes
```bash
./dev.sh test
```

## 🧪 Testing Your Setup

### 1. Test Basic Functionality
```bash
# Test API endpoints
curl https://app-5108296280.us-central1.run.app/health

# Test local development
./dev.sh start
```

### 2. Test Sophisticated Prompts (After Implementation)
```bash
# Create test parsing request
curl -X POST https://app-5108296280.us-central1.run.app/v1/parse \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": "Customer: John Doe\nEmail: john@example.com\nTotal: $99.99",
    "outputSchema": {
      "customerName": "string",
      "email": "email", 
      "total": "number"
    }
  }'
```

### 3. Performance Testing (Full Setup)
```bash
# Load testing with autocannon
autocannon -c 10 -d 30 https://app-5108296280.us-central1.run.app/health

# Memory profiling
clinic doctor -- node your-app.js
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Permission Errors
```bash
# Fix script permissions
chmod +x *.sh

# Run with sudo if needed (Linux)
sudo ./setup-parserator-dev-environment.sh
```

#### 2. Node.js Issues
```bash
# Check Node.js version
node --version

# Reinstall if needed
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Firebase Authentication
```bash
# Login to Firebase
firebase login

# Set project
firebase use parserator-production
```

#### 4. Path Issues (Windows)
- Ensure Node.js is in your PATH
- Restart Command Prompt/PowerShell after installation
- Run as Administrator if needed

#### 5. WSL Issues
```bash
# Update WSL to latest version
wsl --update

# Use Linux commands in WSL
./setup-parserator-dev-environment.sh
```

## 🎯 Development Best Practices

### 1. Git Workflow
```bash
# Use the pre-configured aliases
gst                    # git status
gco feature-branch     # git checkout
gcm "commit message"   # git commit -m
glg                    # git log --oneline --graph
```

### 2. Code Quality
- Code is auto-formatted with Prettier on save
- ESLint runs automatically and fixes issues
- TypeScript provides real-time error checking

### 3. Testing Strategy
```bash
# Run tests frequently during development
./dev.sh test

# Run specific test files
npm test -- --testNamePattern="architect"
```

### 4. Performance Monitoring
```bash
# Profile your application
clinic doctor -- node your-app.js

# Generate flame graphs
0x your-app.js
```

## 📚 Additional Resources

### Documentation Locations
- **Main Guide**: `DEVELOPMENT_ENVIRONMENT_GUIDE.md` (this file)
- **Prompt Reconstruction**: `SOPHISTICATED_PROMPTS_RECONSTRUCTION.md`
- **Full Development Guide**: `~/parserator-dev/docs/DEVELOPMENT_GUIDE.md` (Full Setup)

### Useful Links
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Support
- Check logs: `./dev.sh logs` or `plog`
- Firebase console: https://console.firebase.google.com/
- API status: https://app-5108296280.us-central1.run.app/health

## 🎉 You're Ready!

Choose your setup option and start developing:

1. **Quick Start**: `./quick-dev-setup.sh` → `./dev.sh start`
2. **Full Setup**: `./setup-parserator-dev-environment.sh` → `parserator-dev start`
3. **Windows**: `setup-dev-windows.bat` → `dev.bat start`

Happy coding! 🚀
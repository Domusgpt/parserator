# Parserator Deployment Guide

## 🚀 Quick Start - Manual Publishing Tasks

### 1. Python SDK to PyPI (5 minutes)

**Prerequisites:**
- PyPI account (register at https://pypi.org/account/register/)
- `twine` installed (`pip install twine`)

**Steps:**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/python-sdk
twine upload dist/*
```

**Files being uploaded:**
- `parserator_sdk-1.1.0a0-py3-none-any.whl` (35KB)
- `parserator_sdk-1.1.0a0.tar.gz` (20KB)

**Verification:**
After upload, check: https://pypi.org/project/parserator-sdk/

---

### 2. Chrome Extension to Chrome Web Store (10 minutes)

**Prerequisites:**
- Chrome Web Store developer account ($5 one-time fee)
- Access to https://chrome.google.com/webstore/devconsole

**Steps:**
1. Go to Chrome Web Store Developer Dashboard
2. Click "Add new item"
3. Upload: `/chrome-extension/parserator-chrome-extension-v1.0.2.zip` (1.9MB)
4. Fill in store listing:
   - **Name**: Parserator - AI-Powered Text Parser
   - **Category**: Productivity
   - **Description**: (see template below)
   - **Screenshots**: Use provided files (screenshot-1-popup.png, etc.)
   - **Icons**: Use provided promotional tiles

**Store Description Template:**
```
Transform unstructured text into structured JSON with revolutionary AI-powered parsing.

🎯 FEATURES:
✓ Right-click parsing on any webpage
✓ 95% accuracy with 70% cost reduction
✓ Architect-Extractor dual-stage processing
✓ EMA-compliant data sovereignty
✓ Developer-focused workflow integration

🔧 USE CASES:
• Extract contact info from emails
• Parse product data from web pages
• Structure research data for analysis
• Convert documents to database entries

Built for developers and data teams who value accuracy, efficiency, and data sovereignty.

🌐 Get your API key: https://parserator.com
📖 Documentation: https://parserator.com/docs
🔒 Privacy Policy: https://parserator.com/privacy
```

**Review Timeline:** 1-3 business days

---

### 3. VS Code Extension to Marketplace (10 minutes)

**Prerequisites:**
- Microsoft/Azure account
- Access to https://marketplace.visualstudio.com/manage

**Steps:**
1. Go to VS Code Marketplace Publisher Portal
2. Create publisher profile if needed (ID: `domusgpt`)
3. Upload: `/vscode-extension/parserator-1.0.0.vsix` (515KB)
4. Fill in metadata:
   - **Display Name**: Parserator
   - **Categories**: Data Science, Machine Learning, Formatters
   - **Tags**: parsing, ai, json, data-extraction, llm

**Alternative Method (CLI):**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/vscode-extension
vsce publish --packagePath parserator-1.0.0.vsix
```

**Review Timeline:** 1-2 business days

---

### 4. Dashboard Deployment (5 minutes)

**Option A: Netlify (Recommended)**
1. Go to https://netlify.com
2. Drag & drop `/dashboard/out/` folder
3. Custom domain: Configure to point to parserator.com/dashboard

**Option B: Vercel**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/dashboard
vercel --prod
```

**Option C: Firebase Hosting (Already configured)**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/dashboard
firebase deploy --only hosting
```

**Files being deployed:**
- `index.html` - Main landing page
- `docs.html` - Documentation
- `privacy-policy.html` - Privacy policy
- `terms.html` - Terms of service
- Assets: logos, images (2MB total)

---

### 5. JetBrains Plugin (Alternative Methods)

**Option A: Fix Build Environment**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/jetbrains-plugin
./gradlew buildPlugin
# Output: build/distributions/parserator-*.zip
```

**Option B: IntelliJ IDEA Manual Build**
1. Open IntelliJ IDEA
2. File → Open → Select jetbrains-plugin directory
3. Build → Prepare Plugin Module for Deployment
4. Output saved to project root

**Option C: Docker Build (If needed)**
```bash
cd /mnt/c/Users/millz/parserator-launch-ready/jetbrains-plugin
docker run --rm -v $(pwd):/project -w /project gradle:7.6-jdk11 gradle buildPlugin
```

**Submission:**
- Upload to https://plugins.jetbrains.com/
- Plugin file: `parserator-*.zip` from build output

---

## 📊 Current Status Verification

### ✅ Already Live & Working
- **API**: https://app-5108296280.us-central1.run.app/v1/parse
- **Website**: https://parserator-production.web.app
- **MCP Server**: npm install parserator-mcp-server
- **Node SDK**: npm install parserator-sdk

### ✅ Ready to Deploy (Built & Tested)
- **Python SDK**: `/python-sdk/dist/` (35KB wheel + 20KB tar.gz)
- **Chrome Extension**: `parserator-chrome-extension-v1.0.2.zip` (1.9MB)
- **VS Code Extension**: `parserator-1.0.0.vsix` (515KB)
- **Dashboard**: `/dashboard/out/` (Static files, 2MB)

### ⏳ Needs Manual Packaging
- **JetBrains Plugin**: Complete Kotlin source in `/jetbrains-plugin/`

---

## 🎯 Success Metrics

### Immediate (24 hours)
- [ ] Python SDK downloadable from PyPI
- [ ] Chrome extension submitted (pending review)
- [ ] VS Code extension submitted (pending review)
- [ ] Dashboard live and accessible

### Short-term (1 week)
- [ ] Chrome extension approved and live
- [ ] VS Code extension approved and live
- [ ] JetBrains plugin built and submitted
- [ ] 100+ total downloads across platforms

### Long-term (1 month)
- [ ] 1,000+ downloads
- [ ] 4.5+ star ratings on all platforms
- [ ] Active user feedback and feature requests
- [ ] Revenue generation from API usage

---

## 🛠️ Troubleshooting

### Common Issues

**PyPI Upload Fails:**
- Ensure unique version number
- Check package name isn't taken
- Verify twine authentication

**Chrome Extension Rejected:**
- Review manifest.json permissions
- Ensure privacy policy is accessible
- Check for overly broad host permissions

**VS Code Extension Issues:**
- Verify publisher profile is complete
- Check package.json metadata completeness
- Ensure VSIX file is under 50MB

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Clear caches: npm cache clean --force

### Support Resources
- **Documentation**: https://parserator.com/docs
- **Issues**: https://github.com/domusgpt/parserator/issues
- **Email**: Gen-rl-millz@parserator.com

---

## 🔄 Automated Deployments (Future)

Once manual publishing is complete, consider setting up:

1. **GitHub Actions CI/CD**
2. **Automated version bumping**
3. **Release artifact generation**
4. **Store submission automation** (where APIs allow)

This deployment guide ensures successful launch across all major development platforms while maintaining EMA compliance and user data sovereignty principles.
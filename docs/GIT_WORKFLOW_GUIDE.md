# 🔄 Parserator Git Workflow & Branch Management Guide

**Repository:** Domusgpt/parserator (Private)  
**Main Branches:** main, shared-core-implementation  
**Active Development Branches:** 6+ feature branches  
**Last Updated:** June 16, 2025

---

## 🌳 **CURRENT BRANCH STRUCTURE**

### **Primary Branches**
| Branch | Purpose | Status | Protection |
|--------|---------|--------|------------|
| `main` | Production-ready code | ✅ Active | Protected |
| `shared-core-implementation` | Core architecture development | 🔧 Current | Active work |

### **Active Feature Branches**
Based on repository analysis from GitHub screenshots:

| Branch | Last Updated | Status | Purpose |
|--------|--------------|--------|---------|
| `fix/api-enhancements` | 48 min ago | 🔥 Hot | Security & error handling fixes |
| `fix/lazy-load-gemini` | 5 hours ago | 🔧 Active | Performance optimization |
| `shared-core-implementation` | 11 hours ago | 🏗️ Current | Core system architecture |
| `fix/npm-audit-vulnerabilities-and-sdk-tests` | 13 hours ago | 🛡️ Security | Vulnerability patches |
| `feature/api-critical-systems` | 14 hours ago | ⚡ Critical | Essential system features |

### **Archived/Backup Branches**
- `backup-before-cleanup` - Pre-refactor state
- `parserator-launch-ready` - Launch preparation branch
- `public-release` - Public release candidate
- `jules_wip_3868816998061827602` - Jules work-in-progress

---

## 🚀 **RECOMMENDED WORKFLOW**

### **1. Feature Development Process**

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Work on feature
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push -u origin feature/your-feature-name
# Create PR via GitHub UI
```

### **2. Security Fix Process (HIGH PRIORITY)**

```bash
# Critical security fixes
git checkout main
git pull origin main
git checkout -b fix/security-rate-limiting

# Implement fixes
git add .
git commit -m "fix: implement rate limiting middleware

- Add express-rate-limit for anonymous users
- Enforce 5 RPM limit for trial access
- Return proper 429 responses
- Fixes security vulnerability identified in testing"

git push -u origin fix/security-rate-limiting
```

### **3. Hotfix Process**

```bash
# For production emergencies
git checkout main
git checkout -b hotfix/critical-issue
# Fix, test, commit
git checkout main
git merge hotfix/critical-issue
git push origin main
git branch -d hotfix/critical-issue
```

---

## 📋 **COMMIT MESSAGE STANDARDS**

### **Format**
```
type(scope): description

Detailed explanation if needed
- Bullet points for changes
- Reference issues: Fixes #123

Co-authored-by: Jules <jules@example.com>
```

### **Types**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `security:` - Security-related changes

### **Examples**
```bash
git commit -m "feat: add structured output parsing

- Implement dual-stage AI architecture
- Add Architect and Extractor models
- Support dynamic schema generation
- Improve parsing accuracy to 95%"

git commit -m "fix: resolve XSS input validation

- Add input sanitization middleware
- Implement request size limits
- Improve error handling for malformed input
- Fixes security vulnerability in /v1/parse endpoint"

git commit -m "security: implement comprehensive rate limiting

- Add express-rate-limit middleware
- Enforce tier-based request limits
- Add proper 429 error responses
- Prevent API abuse by anonymous users"
```

---

## 🔄 **BRANCH LIFECYCLE MANAGEMENT**

### **Current Priority: Security Fixes**

Based on testing results, immediate branch priorities:

1. **`fix/api-enhancements`** (48 min ago)
   - Merge ASAP after security review
   - Contains critical error handling improvements

2. **`fix/lazy-load-gemini`** (5 hours ago)
   - Performance optimization
   - Merge after security fixes

3. **`shared-core-implementation`** (Current branch)
   - Core architecture work
   - Continue development in parallel

### **Recommended Merge Order**
```bash
# 1. Security fixes first
fix/api-enhancements → main

# 2. Performance improvements  
fix/lazy-load-gemini → main

# 3. Vulnerability patches
fix/npm-audit-vulnerabilities-and-sdk-tests → main

# 4. Core architecture (ongoing)
shared-core-implementation → main (when ready)
```

---

## 🧪 **TESTING REQUIREMENTS**

### **Before Merging Any Branch**
```bash
# 1. Run security tests
./security-scanner.sh full

# 2. Run performance tests
./performance-monitor.sh load

# 3. Run comprehensive API tests
./test-parserator-complete.sh

# 4. Check CI/CD pipeline
git push && check GitHub Actions
```

### **Required Checks**
- ✅ All tests passing (6/6)
- ✅ Security scan clean
- ✅ Performance within limits
- ✅ Code review approved
- ✅ Documentation updated

---

## 📦 **RELEASE MANAGEMENT**

### **Version Strategy**
Currently using semantic versioning in API responses:
- `version: "1.0.0"` in API metadata
- Increment based on changes:
  - `1.0.x` - Bug fixes, security patches
  - `1.x.0` - New features, API enhancements  
  - `x.0.0` - Breaking changes

### **Release Process**
```bash
# 1. Prepare release branch
git checkout main
git checkout -b release/v1.0.1

# 2. Update version numbers
# Edit package.json, API version, docs

# 3. Final testing
npm test && ./security-scanner.sh full

# 4. Create release
git tag v1.0.1
git push origin v1.0.1

# 5. Deploy via CI/CD
# GitHub Actions handles Firebase deployment
```

---

## 🤝 **COLLABORATION GUIDELINES**

### **Code Review Process**
1. **Self-review** checklist before PR
2. **Security review** for any API changes
3. **Performance review** for core changes
4. **Documentation review** for new features

### **PR Description Template**
```markdown
## Changes
- Brief description of changes
- List of modified files/components

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security scanner clean
- [ ] Manual testing completed

## Security Considerations
- Any security implications
- Input validation changes
- Authentication/authorization impact

## Breaking Changes
- List any breaking changes
- Migration steps if needed
```

### **Working with Jules**
- Jules appears as `google-labs-jules[bot]` in contributors
- Coordinate on shared branches via GitHub issues
- Use `Co-authored-by:` in commits for pair programming

---

## 🚨 **EMERGENCY PROCEDURES**

### **Critical Security Issue**
```bash
# 1. Immediate hotfix
git checkout main
git checkout -b hotfix/security-critical

# 2. Fix, test, deploy
# Implement fix
./security-scanner.sh full
git commit -m "security: fix critical vulnerability"

# 3. Emergency deployment
git checkout main
git merge hotfix/security-critical
git push origin main
# Monitor CI/CD deployment
```

### **Production Rollback**
```bash
# If deployment causes issues
git checkout main
git revert HEAD~1  # Revert last commit
git push origin main
# CI/CD will redeploy previous version
```

---

## 📊 **CURRENT STATUS & NEXT STEPS**

### **Immediate Actions (This Week)**
1. Merge `fix/api-enhancements` after security review
2. Create `fix/rate-limiting` branch for critical security fix
3. Test and merge performance optimizations
4. Prepare security patch release

### **Branch Cleanup (Next Week)**
1. Archive completed feature branches
2. Merge or close stale branches
3. Update branch protection rules
4. Clean up remote tracking branches

### **Long-term Strategy**
1. Implement automated security scanning in CI/CD
2. Add branch naming conventions enforcement
3. Set up automatic dependency updates
4. Create release automation

---

*This guide should be followed by all contributors to maintain code quality and security standards in the Parserator repository.*
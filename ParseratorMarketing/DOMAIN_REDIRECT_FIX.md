# URGENT: Fix parserator.com Domain Redirect

## Current Issue
- parserator.com redirects to "/lander" instead of the main web app
- Should redirect to https://parserator-production.web.app/ (the actual working site)

## Steps to Fix

### Firebase Console Fix
1. Go to: https://console.firebase.google.com/project/parserator-production/hosting/sites
2. Click on "parserator.com" domain
3. Remove any redirect to "/lander"
4. Ensure it points to the main site index.html
5. Check custom domain configuration

### Alternative: Direct Firebase CLI Fix
```bash
# Navigate to the actual Parserator project directory (not marketing repo)
cd [parserator-main-project-directory]
firebase use parserator-production
firebase hosting:channel:list
# Fix domain configuration
```

## Verification
- Test: https://parserator.com should show the EMA-focused site
- Test: https://parserator-production.web.app should be identical
- Both should show the working API demo, not a marketing lander

## Status
❌ parserator.com redirects to wrong "/lander" page
✅ parserator-production.web.app works correctly with EMA messaging
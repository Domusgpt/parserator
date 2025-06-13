# Quick Domain Setup - Parserator.com → Firebase

## What You Need to Do NOW:

### 1. In Firebase Console (5 minutes)
1. Go to: https://console.firebase.google.com/project/parserator-production/hosting/sites
2. Click "Add custom domain"
3. Enter: `parserator.com`
4. Firebase will show you:
   - A TXT record for verification
   - 2 A records for the domain

### 2. In GoDaddy (10 minutes)
1. Log into GoDaddy
2. Go to: My Products → Domain → parserator.com → DNS
3. Delete any existing A records for "@"
4. Add these records:

**For Domain Verification:**
```
Type: TXT
Name: @
Value: [Firebase will give you this - looks like: google-site-verification=...]
TTL: 600
```

**For the Domain:**
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 600

Type: A  
Name: @
Value: 151.101.65.195
TTL: 600
```

**For www redirect:**
```
Type: CNAME
Name: www
Value: parserator.com.
TTL: 3600
```

### 3. Back in Firebase (2 minutes)
1. Click "Verify" after adding the TXT record
2. Once verified, Firebase will provision SSL certificate
3. Add `www.parserator.com` as another domain

## Timeline:
- DNS changes: 5 minutes to 1 hour (usually fast)
- Domain verification: 5-30 minutes after DNS
- SSL certificate: 1-24 hours after verification
- **Total: Usually working within 2-4 hours**

## Test Your Domain:
```bash
# Check DNS propagation
nslookup parserator.com

# Should return:
# 151.101.1.195
# 151.101.65.195
```

## Your Live URLs Will Be:
- https://parserator.com
- https://www.parserator.com
- https://parserator-production.web.app (backup)

## Need Help?
The detailed guide is at: GODADDY_FIREBASE_DOMAIN_SETUP.md
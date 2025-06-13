# FIREBASE DOMAIN SETUP - STEP BY STEP

## STEP 1: Open Firebase Console

1. Go to: https://console.firebase.google.com/project/parserator-production/hosting/sites
2. You should see your site: `parserator-production`
3. Click on it to enter the hosting dashboard

## STEP 2: Add Your Domain

1. Look for the **"Add custom domain"** button (usually in the top right)
2. Click it
3. Enter: `parserator.com` (without www, without https://)
4. Click **Continue**

## STEP 3: Firebase Will Show You TWO Things

### A. Verification TXT Record
Firebase will show something like:
```
Add this TXT record to verify ownership:
Name: @ or parserator.com
Value: google-site-verification=abcd1234567890xxxxx
```

**COPY THIS VALUE!** You need it for GoDaddy.

### B. Two A Records
Firebase will show:
```
Add these A records:
Name: @ or parserator.com
Value: 151.101.1.195

Name: @ or parserator.com  
Value: 151.101.65.195
```

## STEP 4: Keep Firebase Open!

Don't close the Firebase window - you'll need to come back to click "Verify" after adding the DNS records.

## WHAT FIREBASE IS LOOKING FOR:

1. **Proof you own the domain** (TXT record)
2. **Where to send traffic** (A records)
3. **SSL certificate permission** (happens automatically after verification)

## QUICK CHECKLIST:
- [ ] Firebase Console open
- [ ] Clicked "Add custom domain"
- [ ] Entered parserator.com
- [ ] Copied the TXT verification value
- [ ] Copied both A record IPs
- [ ] Ready to go to GoDaddy

## NEXT: Go to GoDaddy with these values!
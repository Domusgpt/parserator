# Complete Guide: Connecting GoDaddy Domain (parserator.com) to Firebase Hosting

## Overview
This guide walks you through connecting your GoDaddy domain to Firebase hosting, ensuring both www and non-www versions work with SSL certificates.

## Prerequisites
- Active GoDaddy domain (parserator.com)
- Firebase project with hosting enabled
- Firebase CLI installed (for deployment)

## Step 1: Add Domain in Firebase Console

1. **Navigate to Firebase Hosting**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Click "Hosting" in the left sidebar

2. **Add Custom Domain**
   - Click "Add custom domain" button
   - Enter `parserator.com` (without www)
   - Click "Continue"

3. **Verify Domain Ownership**
   - Firebase will provide a TXT record for verification
   - Example: `google-site-verification=abc123xyz789...`
   - Keep this page open - you'll need it after DNS setup

## Step 2: Configure DNS in GoDaddy

### Access GoDaddy DNS Management

1. Log in to [GoDaddy](https://www.godaddy.com)
2. Go to "My Products"
3. Find your domain (parserator.com)
4. Click "DNS" or "Manage DNS"

### Add Firebase Verification TXT Record

1. Click "Add" or "Add Record"
2. Select record type: **TXT**
3. Configure:
   - **Host/Name**: `@` (represents root domain)
   - **Value**: Paste the verification string from Firebase
   - **TTL**: 1 hour (or default)
4. Click "Save"

### Add A Records for Root Domain

Firebase uses these specific IP addresses for hosting:

1. **Delete existing A records** pointing to GoDaddy parking or other services
2. Add new A records:
   
   **First A Record:**
   - Type: **A**
   - Host/Name: `@`
   - Points to: `151.101.1.195`
   - TTL: 1 hour

   **Second A Record:**
   - Type: **A**
   - Host/Name: `@`
   - Points to: `151.101.65.195`
   - TTL: 1 hour

### Add CNAME Record for WWW

1. Check if CNAME for www exists - delete if pointing elsewhere
2. Add new CNAME:
   - Type: **CNAME**
   - Host/Name: `www`
   - Points to: `parserator.com.` (note the trailing dot)
   - TTL: 1 hour

### Final DNS Configuration

Your GoDaddy DNS records should look like this:

```
Type    Name/Host    Value/Points to           TTL
----    ---------    -------------------       ---
A       @            151.101.1.195            1 hour
A       @            151.101.65.195           1 hour
CNAME   www          parserator.com.          1 hour
TXT     @            google-site-verification=... 1 hour
```

## Step 3: Complete Firebase Setup

1. **Return to Firebase Console**
   - After DNS changes (wait 5-10 minutes)
   - Click "Verify" on the domain verification page

2. **Wait for Verification**
   - Firebase will check the TXT record
   - This usually takes 5-30 minutes
   - If it fails, wait longer and try again

3. **Setup Complete**
   - Once verified, Firebase will show "Connected" status
   - SSL provisioning begins automatically

## Step 4: Add WWW Redirect in Firebase

1. In Firebase Console, click "Add custom domain" again
2. Enter `www.parserator.com`
3. Since the root domain is verified, this should verify instantly
4. Firebase will handle the redirect automatically

## Step 5: Configure Firebase Hosting (firebase.json)

Ensure your `firebase.json` includes proper redirect rules:

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/",
        "destination": "https://parserator.com",
        "type": 301
      }
    ]
  }
}
```

## SSL Certificate Setup

**Good news!** Firebase automatically provisions and renews SSL certificates via Let's Encrypt. No action needed from you.

- SSL provisioning starts after domain verification
- Takes 1-24 hours (usually under 2 hours)
- Covers both parserator.com and www.parserator.com
- Auto-renews before expiration

## Propagation Timeline

1. **DNS Changes**: 5 minutes - 48 hours (usually under 1 hour)
2. **Domain Verification**: 5-30 minutes after DNS propagates
3. **SSL Certificate**: 1-24 hours after verification
4. **Full Setup**: Most sites are fully operational within 2-4 hours

## Testing Your Setup

### Check DNS Propagation
```bash
# Check A records
nslookup parserator.com

# Check CNAME
nslookup www.parserator.com

# Alternative: Use online tool
# Visit: https://www.whatsmydns.net/
# Enter: parserator.com
# Check A record propagation globally
```

### Test Your Site
1. Visit http://parserator.com (should redirect to HTTPS)
2. Visit http://www.parserator.com (should redirect to HTTPS root)
3. Check for padlock icon (SSL active)
4. Use SSL checker: https://www.sslshopper.com/ssl-checker.html

## Common Issues & Solutions

### "Domain Not Verified" Error
- **Solution**: Wait longer (up to 1 hour) for DNS propagation
- Ensure TXT record is exactly as provided (no extra spaces)
- Try clearing browser cache and retrying

### Site Shows "Page Not Found"
- **Solution**: Deploy your site using Firebase CLI:
  ```bash
  firebase deploy --only hosting
  ```

### SSL Certificate Not Working
- **Solution**: 
  - Wait up to 24 hours for provisioning
  - Ensure both A records are correctly added
  - Check Firebase Console for any error messages

### WWW Version Not Working
- **Solution**: 
  - Verify CNAME record is correct
  - Add www.parserator.com as separate domain in Firebase
  - Ensure trailing dot in CNAME value

### Old GoDaddy Page Still Showing
- **Solution**:
  - Clear browser cache (Ctrl+Shift+Delete)
  - Try incognito/private browsing
  - Flush DNS cache:
    ```bash
    # Windows
    ipconfig /flushdns
    
    # Mac
    sudo dscacheutil -flushcache
    
    # Linux
    sudo systemctl restart systemd-resolved
    ```

## Important Notes

1. **Never delete** the TXT verification record - Firebase may recheck it
2. **Keep A records** exactly as shown - these are Firebase's IPs
3. **Don't add** additional A records unless instructed by Firebase
4. **Be patient** - DNS changes take time to propagate globally
5. **Save your DNS settings** screenshot before making changes

## Quick Checklist

- [ ] Domain added in Firebase Console
- [ ] TXT record added in GoDaddy
- [ ] Two A records added pointing to Firebase IPs
- [ ] CNAME record added for www
- [ ] Domain verified in Firebase
- [ ] WWW version added and verified
- [ ] Site deployed via Firebase CLI
- [ ] SSL certificate active (padlock showing)
- [ ] Both www and non-www versions working

## Support Resources

- **Firebase Hosting Docs**: https://firebase.google.com/docs/hosting/custom-domain
- **GoDaddy Support**: https://www.godaddy.com/help/dns-680
- **DNS Checker**: https://mxtoolbox.com/DNSLookup.aspx
- **Firebase Status**: https://status.firebase.google.com/

## Next Steps

After your domain is connected:
1. Deploy your website files using `firebase deploy`
2. Set up redirects for old URLs if migrating
3. Configure security headers in `firebase.json`
4. Set up monitoring and analytics
5. Test site performance and SEO

Remember: Full propagation can take up to 48 hours, but most setups work within 2-4 hours. Be patient and follow the steps carefully!
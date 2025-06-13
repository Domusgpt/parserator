# 🔧 Domain Fix: parserator.com → Firebase Hosting

**Issue**: parserator.com redirects to broken "/lander" page  
**Goal**: Point parserator.com to parserator-production.web.app  
**Method**: GoDaddy DNS → Firebase Hosting configuration

## 🚨 CURRENT PROBLEM

```bash
curl -s https://parserator.com | head -5
# Returns: <script>window.onload=function(){window.location.href="/lander"}</script>
```

**Working URL**: https://parserator-production.web.app ✅  
**Broken URL**: https://parserator.com ❌

## 📋 STEP-BY-STEP FIX

### **Step 1: Firebase Console Setup**

1. **Navigate to Firebase Hosting**
   - Go to Firebase Console → Parserator Production project
   - Click "Hosting" in left sidebar
   - Click "Add custom domain"

2. **Add parserator.com Domain**
   - Enter: `parserator.com` (root domain, no www)
   - Firebase will show verification TXT record
   - **Copy this TXT record** (format: `google-site-verification=XXXX...`)

### **Step 2: GoDaddy DNS Configuration**

#### **A. Add Verification TXT Record**
```
Record Type: TXT
Host: @
Value: google-site-verification=XXXX... (from Firebase)
TTL: 1 hour
```

#### **B. Update A Records for Root Domain**
**Remove existing A records for @, then add:**
```
Record Type: A
Host: @
Points to: 151.101.1.195
TTL: 1 hour

Record Type: A  
Host: @
Points to: 151.101.65.195
TTL: 1 hour
```

#### **C. Configure www Subdomain**
**Remove existing www CNAME, then add:**
```
Record Type: CNAME
Host: www
Points to: parserator.com
TTL: 1 hour
```

### **Step 3: Firebase Verification**

1. **Wait 5-10 minutes** for DNS propagation
2. **Return to Firebase Console** 
3. **Click "Verify"** button
4. **Add www domain** (optional redirect setup)

### **Step 4: SSL & Final Configuration**

- Firebase auto-provisions SSL certificate
- Test both URLs:
  - https://parserator.com
  - https://www.parserator.com

## 🔍 VERIFICATION COMMANDS

```bash
# Check DNS propagation
dig parserator.com A
dig parserator.com TXT

# Test site response  
curl -I https://parserator.com
curl -s https://parserator.com | grep title

# Verify SSL certificate
openssl s_client -connect parserator.com:443 -servername parserator.com
```

## 📊 EXPECTED RESULTS

### **Before Fix**
- parserator.com → redirects to "/lander" (404)
- Working site only at parserator-production.web.app

### **After Fix**
- parserator.com → serves full Parserator website ✅
- www.parserator.com → redirects to parserator.com ✅
- SSL certificate active ✅
- Professional domain for marketing ✅

## ⚠️ TROUBLESHOOTING

### **Common Issues**

1. **TXT Record Not Found**
   - Wait longer for DNS propagation (up to 1 hour)
   - Verify exact TXT value copied from Firebase
   - Check no duplicate TXT records exist

2. **A Records Not Working**
   - Confirm both Firebase IP addresses added
   - Remove any conflicting A records
   - Verify Host field is exactly `@`

3. **SSL Certificate Pending**
   - Can take 2-24 hours after domain verification
   - Firebase handles this automatically
   - Check Firebase Console for status

### **Verification Steps**
```bash
# Confirm DNS points to Firebase
nslookup parserator.com
# Should show: 151.101.1.195 and 151.101.65.195

# Check if site loads correctly  
curl -L https://parserator.com | grep "Parserator"
# Should return website content, not "/lander" redirect
```

## 🎯 SUCCESS CRITERIA

- ✅ parserator.com loads the full Parserator website
- ✅ No more "/lander" redirect error
- ✅ SSL certificate shows valid
- ✅ Same content as parserator-production.web.app
- ✅ Professional domain ready for marketing launch

Once complete, the domain will properly showcase the working Parserator platform instead of the broken redirect!
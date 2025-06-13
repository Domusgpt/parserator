# GODADDY DNS SETUP - STEP BY STEP

## STEP 1: Log Into GoDaddy

1. Go to: https://godaddy.com
2. Sign in to your account
3. Go to **"My Products"**
4. Find **parserator.com** and click **"DNS"** or **"Manage"**

## STEP 2: Access DNS Management

You should see a page titled:
**"DNS Management for parserator.com"**

If you see a different interface, look for:
- "DNS"
- "DNS Management" 
- "Advanced DNS"
- "DNS Records"

## STEP 3: Clear Existing Records

**IMPORTANT:** Delete any existing A records for "@" or "parserator.com"

Look for:
```
Type: A
Name: @ or parserator.com
Value: (any IP address)
```

**DELETE THESE** - Click the trash/delete icon

## STEP 4: Add Firebase Records

### A. Add TXT Record (for verification)
Click **"Add Record"** or **"Add"**
```
Type: TXT
Host: @ (or blank, or parserator.com)
Value: [PASTE THE google-site-verification VALUE FROM FIREBASE]
TTL: 600 or 1 Hour
```

### B. Add First A Record
Click **"Add Record"**
```
Type: A
Host: @ (or blank, or parserator.com)
Points to: 151.101.1.195
TTL: 600 or 1 Hour
```

### C. Add Second A Record
Click **"Add Record"**
```
Type: A  
Host: @ (or blank, or parserator.com)
Points to: 151.101.65.195
TTL: 600 or 1 Hour
```

### D. Add WWW Redirect (Optional but recommended)
Click **"Add Record"**
```
Type: CNAME
Host: www
Points to: parserator.com.
TTL: 1 Hour
```

**IMPORTANT:** Note the dot (.) after parserator.com - some systems need this!

## STEP 5: Save Changes

1. Click **"Save"** or **"Save Changes"**
2. GoDaddy might ask you to confirm
3. Changes should save immediately

## STEP 6: Go Back to Firebase

1. Go back to your Firebase tab
2. Click **"Verify"** 
3. Firebase will check for the TXT record
4. If successful, it will start setting up SSL

## WHAT YOU SHOULD SEE IN GODADDY AFTER SETUP:

```
TXT  @  google-site-verification=xxxxx  600
A    @  151.101.1.195              600  
A    @  151.101.65.195              600
CNAME www parserator.com.           3600
```

## TROUBLESHOOTING:

**If GoDaddy interface looks different:**
- Look for "Advanced DNS" or "DNS Records"
- Some accounts show "DNS Zone File Editor"
- Mobile interface might be different - use desktop

**If you can't delete existing A records:**
- They might be called "Domain forwarding"
- Look for "Forwarding" section to disable
- Contact GoDaddy support if stuck

**Common GoDaddy Field Names:**
- Host = Name = Record Name
- Points to = Value = Target
- @ = Root domain = your domain name

## WHEN DONE:
Go back to Firebase and click "Verify"!
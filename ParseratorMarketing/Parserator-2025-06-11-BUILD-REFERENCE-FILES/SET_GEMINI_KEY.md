# 🔑 **GEMINI API KEY SETUP**

## **You need to set your Gemini API key before deploying!**

### **Step 1: Get Your Gemini API Key**
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

### **Step 2: Set the Key as Firebase Secret**
Run this command with YOUR actual API key:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted, paste your actual Gemini API key.

### **Step 3: Continue Deployment**
After setting the key, run:

```bash
firebase deploy --only functions
```

### **Important Notes:**
- Keep your API key secret!
- The key will be securely stored in Firebase
- It will be available to your functions at runtime
- Never commit the key to your repository
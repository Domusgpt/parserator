# Parserator Deployment Guide

This guide covers deploying Parserator to production using Firebase Functions and Google Cloud Platform.

## Prerequisites

### Required Accounts & Services
- Google Cloud Platform account
- Firebase project
- Gemini API access (Google AI Studio)
- Domain for custom API endpoint (optional)

### Local Development Tools
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (`gcloud`)

## Environment Setup

### 1. Google Cloud Project Setup

```bash
# Create new GCP project
gcloud projects create parserator-prod --name="Parserator Production"

# Set as default project
gcloud config set project parserator-prod

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudlogging.googleapis.com
```

### 2. Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select these options:
# ✅ Functions: Configure for Cloud Functions
# ✅ Firestore: Configure for Firestore Database
# ✅ Hosting: Configure for static hosting (optional)

# Choose existing project: parserator-prod
```

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for environment configuration

## Configuration Files

### 1. Firebase Configuration

Create `firebase.json`:

```json
{
  "functions": {
    "runtime": "nodejs18",
    "source": "packages/api",
    "predeploy": ["npm run build"],
    "ignore": [
      "node_modules",
      ".git",
      "firebase-debug.log",
      "firebase-debug.*.log",
      "*.local"
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 2. Firestore Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // API Keys collection (admin only)
    match /apiKeys/{keyId} {
      allow read, write: if false; // Admin only via server
    }
    
    // Usage tracking (system only)
    match /usage/{userId} {
      allow read, write: if false; // System only
    }
    
    // Public docs (if any)
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3. Environment Variables

Create `.env.production`:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Service Configuration
NODE_ENV=production
API_VERSION=1.0.0
MAX_INPUT_SIZE=100000
MAX_SCHEMA_FIELDS=50

# Monitoring
ENABLE_DETAILED_LOGGING=true
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000

# Security
CORS_ORIGIN=https://parserator.com,https://app.parserator.com
```

## Deployment Process

### 1. Pre-deployment Checklist

```bash
# Build and test locally
cd packages/api
npm run build
npm test

# Test with Firebase emulator
firebase emulators:start --only functions,firestore

# Test API endpoints
curl http://localhost:5001/parserator-prod/us-central1/api/health
```

### 2. Production Deployment

```bash
# Set environment secrets
firebase functions:secrets:set GEMINI_API_KEY

# Deploy to production
firebase deploy --only functions

# Verify deployment
curl https://us-central1-parserator-prod.cloudfunctions.net/api/health
```

### 3. Custom Domain Setup (Optional)

```bash
# Reserve static IP
gcloud compute addresses create parserator-api-ip --global

# Get the IP address
gcloud compute addresses describe parserator-api-ip --global

# Configure DNS A record
# api.parserator.com -> [STATIC_IP]

# Set up Load Balancer
gcloud compute url-maps create parserator-api-map \
    --default-backend-bucket=parserator-api-bucket

# Configure SSL certificate
gcloud compute ssl-certificates create parserator-api-ssl \
    --domains=api.parserator.com
```

## Monitoring & Logging

### 1. Cloud Logging Setup

```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com

# Create log sink for errors
gcloud logging sinks create parserator-errors \
    bigquery.googleapis.com/projects/parserator-prod/datasets/logs \
    --log-filter='severity>=ERROR'
```

### 2. Monitoring Dashboards

Create monitoring dashboard in Google Cloud Console:

```json
{
  "name": "Parserator API Monitoring",
  "widgets": [
    {
      "title": "API Request Rate",
      "type": "line_chart",
      "metric": "cloudfunctions.googleapis.com/function/execution_count"
    },
    {
      "title": "API Latency",
      "type": "line_chart", 
      "metric": "cloudfunctions.googleapis.com/function/execution_times"
    },
    {
      "title": "Error Rate",
      "type": "line_chart",
      "metric": "logging.googleapis.com/user/parserator_errors"
    },
    {
      "title": "Token Usage",
      "type": "line_chart",
      "metric": "logging.googleapis.com/user/gemini_tokens"
    }
  ]
}
```

### 3. Alerting Policies

```bash
# Create alerting policy for high error rate
gcloud alpha monitoring policies create \
    --policy-from-file=monitoring/error-rate-policy.yaml

# Create alerting policy for high latency
gcloud alpha monitoring policies create \
    --policy-from-file=monitoring/latency-policy.yaml
```

## Database Setup

### 1. Firestore Collections

```typescript
// API Keys collection structure
interface IApiKey {
  keyId: string;
  hashedKey: string;
  userId: string;
  tier: 'free' | 'startup' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  monthlyUsage: number;
  monthlyLimit: number;
}

// Usage tracking collection
interface IUsageRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  requestCount: number;
  tokensUsed: number;
  successRate: number;
  averageLatency: number;
}
```

### 2. Initialize Collections

```typescript
// Run once during deployment
async function initializeDatabase() {
  const db = admin.firestore();
  
  // Create indexes
  await db.collection('apiKeys').doc('_index').set({
    indexes: ['hashedKey', 'userId', 'tier', 'isActive']
  });
  
  await db.collection('usage').doc('_index').set({
    indexes: ['userId', 'date']
  });
  
  console.log('Database initialized');
}
```

## Security Configuration

### 1. IAM Roles

```bash
# Create service account for API functions
gcloud iam service-accounts create parserator-api \
    --display-name="Parserator API Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding parserator-prod \
    --member="serviceAccount:parserator-api@parserator-prod.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding parserator-prod \
    --member="serviceAccount:parserator-api@parserator-prod.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter"
```

### 2. API Security

```typescript
// Configure CORS for production
const corsOptions = {
  origin: [
    'https://parserator.com',
    'https://app.parserator.com',
    'https://docs.parserator.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};
```

### 3. Rate Limiting

```typescript
// Production rate limiting configuration
const rateLimitConfig = {
  free: { requests: 100, window: '30d', burst: 10 },
  startup: { requests: 2000, window: '30d', burst: 50 },
  pro: { requests: 10000, window: '30d', burst: 200 },
  enterprise: { requests: 100000, window: '30d', burst: 1000 }
};
```

## Scaling Configuration

### 1. Cloud Functions Configuration

```typescript
// Production function configuration
export const api = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 120,
    maxInstances: 100,
    minInstances: 5, // Keep warm instances
    secrets: ['GEMINI_API_KEY']
  })
  .https
  .onRequest(app);
```

### 2. Auto-scaling Settings

```bash
# Configure auto-scaling
gcloud functions deploy api \
    --runtime=nodejs18 \
    --memory=1GB \
    --timeout=120s \
    --max-instances=100 \
    --min-instances=5 \
    --set-env-vars="NODE_ENV=production"
```

## Backup & Recovery

### 1. Firestore Backup

```bash
# Export Firestore data
gcloud firestore export gs://parserator-prod-backups/$(date +%Y%m%d)

# Schedule daily backups
gcloud scheduler jobs create app-engine backup-firestore \
    --schedule="0 2 * * *" \
    --time-zone="UTC" \
    --http-method=POST \
    --uri="https://us-central1-parserator-prod.cloudfunctions.net/backup"
```

### 2. Disaster Recovery Plan

1. **Data Recovery**: Restore from Firestore exports
2. **Function Recovery**: Redeploy from source code
3. **DNS Recovery**: Update DNS records if needed
4. **Monitoring Recovery**: Restore monitoring dashboards

## Cost Optimization

### 1. Resource Optimization

```typescript
// Optimize function memory based on usage
const optimizeMemory = (complexity: string) => {
  switch (complexity) {
    case 'low': return '512MB';
    case 'medium': return '1GB';
    case 'high': return '2GB';
    default: return '1GB';
  }
};
```

### 2. Monitoring Costs

```bash
# Set up billing alerts
gcloud alpha billing budgets create \
    --billing-account=BILLING_ACCOUNT_ID \
    --display-name="Parserator Budget" \
    --budget-amount=1000USD \
    --threshold-rule=percent:50,spend-basis:CURRENT_SPEND \
    --threshold-rule=percent:75,spend-basis:CURRENT_SPEND
```

## Troubleshooting

### Common Issues

1. **Function Timeout**
   ```bash
   # Increase timeout
   gcloud functions deploy api --timeout=540s
   ```

2. **Memory Issues**
   ```bash
   # Increase memory
   gcloud functions deploy api --memory=2GB
   ```

3. **Cold Starts**
   ```bash
   # Set minimum instances
   gcloud functions deploy api --min-instances=2
   ```

### Debugging Tools

```bash
# View function logs
gcloud functions logs read api --limit=50

# Monitor function metrics
gcloud functions describe api

# Test function locally
firebase functions:shell
```

## Production Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Security rules deployed
- [ ] Monitoring dashboards created
- [ ] Alerting policies configured
- [ ] Load testing completed
- [ ] Backup procedures tested

### Launch
- [ ] Functions deployed to production
- [ ] DNS records updated
- [ ] SSL certificates configured
- [ ] Health checks passing
- [ ] Monitoring active

### Post-Launch
- [ ] Performance metrics baseline established
- [ ] Error rates within acceptable limits
- [ ] Cost monitoring active
- [ ] Documentation updated
- [ ] Team notified of production URLs

---

This deployment guide provides a comprehensive approach to production deployment of Parserator, ensuring reliability, security, and scalability from day one.
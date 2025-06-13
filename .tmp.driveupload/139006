# Parserator Data Transformer Firebase Extension

Transform unstructured data into structured JSON automatically using Parserator's AI-powered parsing engine. Perfect for processing user uploads, documents, emails, and any unstructured data in your Firebase project.

## 🚀 What This Extension Does

This extension listens to a Firestore collection you specify and automatically transforms any unstructured text data into structured JSON using Parserator's advanced Architect-Extractor pattern.

### Key Features

- **🤖 AI-Powered Parsing**: 95% accuracy across 16+ industries
- **⚡ Real-time Processing**: Automatic triggers on document creation
- **🔧 Flexible Schema**: Auto-detection or custom schema definition
- **📊 Analytics**: Built-in processing statistics and monitoring
- **🛡️ Error Handling**: Comprehensive error logging and recovery
- **🎯 EMA Compliant**: No vendor lock-in, full data sovereignty

## 📋 Use Cases

### Document Processing
- **Invoices** → Structured billing data
- **Receipts** → Expense tracking records
- **Contracts** → Key terms and dates
- **Resumes** → Candidate information

### User-Generated Content
- **Contact Forms** → CRM records
- **Support Tickets** → Issue categorization
- **Survey Responses** → Structured feedback
- **Chat Messages** → Intent detection

### Data Migration
- **Legacy Systems** → Modern database formats
- **CSV Files** → Normalized JSON
- **API Responses** → Consistent schemas
- **Web Scraping** → Structured datasets

## 🛠️ How It Works

```mermaid
graph LR
    A[Document Added] --> B[Extension Triggered]
    B --> C[Extract Text Field]
    C --> D[Call Parserator API]
    D --> E[Store Parsed Result]
    E --> F[Optional: Delete Original]
    D --> G[Error Collection] 
```

1. **Document Creation**: User adds document to monitored collection
2. **Automatic Processing**: Extension extracts specified text field
3. **AI Parsing**: Parserator API transforms unstructured text to JSON
4. **Result Storage**: Parsed data saved to output collection
5. **Analytics**: Processing metrics tracked for optimization

## 📦 Installation

### Prerequisites

- Firebase project with Firestore enabled
- Billing enabled (required for extensions)
- Parserator API key ([Get one here](https://parserator.com/signup))

### Install from Firebase Console

1. Go to [Firebase Extensions](https://console.firebase.google.com/project/_/extensions)
2. Search for "Parserator Data Transformer"
3. Click **Install** and follow the configuration steps

### Install via Firebase CLI

```bash
firebase ext:install parserator/data-transformer --project=your-project-id
```

## ⚙️ Configuration

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| **Parserator API Key** | Your API key from parserator.com | `pk_live_...` |
| **Collection Path** | Firestore collection to monitor | `rawData` |
| **Input Field** | Field containing unstructured text | `rawText` |
| **Output Collection** | Where to store parsed results | `parsedData` |

### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| **Schema Field** | Field containing desired output schema | `schema` |
| **Preserve Original** | Keep original documents after processing | `true` |
| **Error Collection** | Collection for error logging | `parseErrors` |

## 📝 Usage Examples

### Basic Document Processing

```javascript
// Add a document to trigger parsing
await db.collection('rawData').add({
  rawText: "Invoice #12345 from Acme Corp for $1,250.00 due 2024-01-15",
  customerEmail: "john@example.com"
});

// Result automatically appears in 'parsedData' collection:
{
  originalDocumentId: "doc123",
  parsedData: {
    invoiceNumber: "12345",
    company: "Acme Corp", 
    amount: 1250.00,
    currency: "USD",
    dueDate: "2024-01-15"
  },
  accuracy: 0.98,
  timestamp: "2024-01-10T10:30:00Z"
}
```

### Custom Schema Processing

```javascript
// Add document with custom schema
await db.collection('rawData').add({
  rawText: "Dr. Sarah Johnson called about patient follow-up",
  schema: {
    doctorName: "string",
    patientAction: "string", 
    urgency: "low|medium|high"
  }
});

// Parsed result follows your schema:
{
  parsedData: {
    doctorName: "Dr. Sarah Johnson",
    patientAction: "follow-up call",
    urgency: "medium"
  },
  schema: { /* original schema */ },
  accuracy: 0.95
}
```

### Real-time Processing with React

```javascript
import { collection, onSnapshot } from 'firebase/firestore';

// Listen for parsed results
const unsubscribe = onSnapshot(
  collection(db, 'parsedData'),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const result = change.doc.data();
        console.log('New parsed data:', result.parsedData);
        
        // Update your UI with structured data
        updateUI(result.parsedData);
      }
    });
  }
);
```

## 📊 Monitoring & Analytics

### Built-in Analytics

The extension provides built-in analytics accessible via Cloud Functions:

```javascript
// Get processing statistics
const analytics = await functions().httpsCallable('getAnalytics')();

console.log(analytics.data);
// {
//   totalDocuments: 1250,
//   totalErrors: 23,
//   successRate: 0.982,
//   averageAccuracy: 0.951,
//   averageProcessingTime: 2.3,
//   period: "30 days"
// }
```

### Health Check Endpoint

Monitor extension health:

```bash
curl https://your-region-your-project.cloudfunctions.net/ext-parserator-data-transformer-healthCheck
```

### Error Monitoring

If you configure an error collection, failed parsing attempts are logged:

```javascript
// Monitor errors
const errors = await db.collection('parseErrors')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();

errors.forEach(doc => {
  const error = doc.data();
  console.log(`Error: ${error.error}`);
  console.log(`Input: ${error.inputData.substring(0, 100)}...`);
});
```

## 🔧 Advanced Configuration

### Firestore Security Rules

Ensure proper access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads/writes to input collection
    match /rawData/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Allow reads from output collection
    match /parsedData/{document} {
      allow read: if request.auth != null;
    }
    
    // Restrict error collection to admins
    match /parseErrors/{document} {
      allow read: if request.auth.token.admin == true;
    }
  }
}
```

### Custom Processing Logic

For advanced use cases, you can extend the extension:

```javascript
// Listen for completion events
const unsubscribe = onSnapshot(
  collection(db, '_parserator_events'),
  (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const event = change.doc.data();
        
        // Custom post-processing
        if (event.data.accuracy < 0.8) {
          // Flag for manual review
          await flagForReview(event.documentId);
        }
        
        // Trigger downstream processes
        await triggerWorkflow(event.documentId);
      }
    });
  }
);
```

## 💰 Pricing

### Extension Costs
- **Firebase Functions**: Pay per invocation (~$0.0000004 per parse)
- **Firestore**: Standard read/write costs
- **Parserator API**: See [pricing page](https://parserator.com/pricing)

### Cost Optimization Tips
1. **Batch Processing**: Group multiple texts in single documents
2. **Schema Reuse**: Define schemas once and reference them
3. **Error Handling**: Monitor and fix common parsing issues
4. **Cleanup**: Use `preserveOriginal: false` for one-time processing

## 🔍 Troubleshooting

### Common Issues

**Extension not triggering:**
- Check Firestore security rules
- Verify collection path configuration
- Ensure documents have the specified input field

**API errors:**
- Verify Parserator API key is correct
- Check API quota limits
- Review error collection for specific messages

**Low accuracy results:**
- Provide custom schema for better results
- Ensure input text is clean and readable
- Check for character encoding issues

**Performance issues:**
- Monitor function timeout limits (default: 60s)
- Consider batch processing for large documents
- Review concurrent execution limits

### Debug Mode

Enable detailed logging:

```bash
# Deploy with debug logging
firebase functions:config:set parserator.debug=true
firebase deploy --only functions
```

### Support

- **Documentation**: [parserator.com/docs](https://parserator.com/docs)
- **Community**: [Discord](https://parserator.com/discord)
- **Issues**: [GitHub](https://github.com/parserator/firebase-extension/issues)
- **Email**: support@parserator.com

## 🚀 What's Next?

### Roadmap
- [ ] **Batch Processing**: Handle multiple documents simultaneously
- [ ] **Real-time Streaming**: WebSocket-based real-time results
- [ ] **Custom Models**: Train models on your specific data
- [ ] **Data Validation**: Automatic quality checks and corrections
- [ ] **Workflow Integration**: Zapier, n8n, and workflow automation

### Contributing

We welcome contributions! This extension is part of the Exoditical Moral Architecture movement - we believe in user sovereignty and the right to leave.

- **Open Source**: Full source code available
- **Portable**: Export all your data anytime
- **Transparent**: No hidden fees or lock-in mechanisms

## 📄 License

MIT License - Use freely in commercial and personal projects.

---

**Built with ❤️ by the Parserator team**

*The ultimate expression of empowerment is the freedom to leave.*
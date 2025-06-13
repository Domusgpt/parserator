import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();

// Extension configuration
const config = {
  parseratorApiKey: process.env.PARSERATOR_API_KEY!,
  collectionPath: process.env.COLLECTION_PATH!,
  inputField: process.env.INPUT_FIELD || 'rawText',
  schemaField: process.env.SCHEMA_FIELD || 'schema',
  outputCollection: process.env.OUTPUT_COLLECTION!,
  preserveOriginal: process.env.PRESERVE_ORIGINAL === 'true',
  errorCollection: process.env.ERROR_COLLECTION || null,
  apiUrl: 'https://app-5108296280.us-central1.run.app/v1/parse'
};

// Parserator API client
class ParseratorClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async parse(inputData: string, outputSchema?: any): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, {
        inputData,
        outputSchema: outputSchema || 'auto'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error) {
      functions.logger.error('Parserator API error:', error);
      throw new Error(`Parserator API failed: ${error}`);
    }
  }
}

// Initialize Parserator client
const parserator = new ParseratorClient(config.parseratorApiKey, config.apiUrl);

// Main parsing function
export const parseData = functions.firestore
  .document(`${config.collectionPath}/{documentId}`)
  .onCreate(async (snap, context) => {
    const documentId = context.params.documentId;
    const data = snap.data();
    
    functions.logger.info(`Processing document ${documentId}`);
    
    try {
      // Validate input data
      if (!data || !data[config.inputField]) {
        functions.logger.warn(`Document ${documentId} missing field ${config.inputField}`);
        return;
      }

      const inputText = data[config.inputField];
      const schema = data[config.schemaField] || undefined;
      
      functions.logger.info(`Parsing text of length ${inputText.length}`);
      
      // Call Parserator API
      const parseResult = await parserator.parse(inputText, schema);
      
      // Prepare output document
      const outputData = {
        originalDocumentId: documentId,
        inputText: config.preserveOriginal ? inputText : null,
        parsedData: parseResult.parsedData || parseResult,
        accuracy: parseResult.accuracy || null,
        processingTime: parseResult.processingTime || null,
        schema: parseResult.schema || schema,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        metadata: {
          extensionVersion: '1.0.0',
          apiVersion: parseResult.apiVersion || 'v1',
          model: parseResult.model || 'architect-extractor'
        }
      };

      // Store parsed result
      await admin.firestore()
        .collection(config.outputCollection)
        .add(outputData);
      
      functions.logger.info(`Successfully processed document ${documentId}`);
      
      // Delete original document if not preserving
      if (!config.preserveOriginal) {
        await snap.ref.delete();
        functions.logger.info(`Deleted original document ${documentId}`);
      }
      
      // Emit completion event
      await admin.firestore()
        .collection('_parserator_events')
        .add({
          type: 'firebase.extensions.parserator-data-transformer.v1.complete',
          documentId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            inputLength: inputText.length,
            accuracy: parseResult.accuracy,
            processingTime: parseResult.processingTime
          }
        });
      
    } catch (error) {
      functions.logger.error(`Error processing document ${documentId}:`, error);
      
      // Log error to error collection if configured
      if (config.errorCollection) {
        await admin.firestore()
          .collection(config.errorCollection)
          .add({
            originalDocumentId: documentId,
            error: error.message || 'Unknown error',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            inputData: data[config.inputField] ? data[config.inputField].substring(0, 1000) : null,
            status: 'error'
          });
      }
      
      // Don't throw - let function complete to avoid retries
      return;
    }
  });

// Lifecycle functions
export const setupParserator = functions.https.onCall(async (data, context) => {
  functions.logger.info('Setting up Parserator Data Transformer extension');
  
  try {
    // Test API connection
    await parserator.parse('test input', { message: 'string' });
    
    // Create initial collections if they don't exist
    const collections = [config.outputCollection];
    if (config.errorCollection) {
      collections.push(config.errorCollection);
    }
    
    for (const collection of collections) {
      const ref = admin.firestore().collection(collection);
      const snapshot = await ref.limit(1).get();
      if (snapshot.empty) {
        await ref.add({
          _setup: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info(`Created collection: ${collection}`);
      }
    }
    
    return { success: true, message: 'Parserator extension setup complete' };
  } catch (error) {
    functions.logger.error('Setup failed:', error);
    throw new functions.https.HttpsError('internal', 'Setup failed');
  }
});

export const updateParserator = functions.https.onCall(async (data, context) => {
  functions.logger.info('Updating Parserator Data Transformer extension');
  
  try {
    // Test new configuration
    await parserator.parse('test input', { message: 'string' });
    
    return { success: true, message: 'Parserator extension updated successfully' };
  } catch (error) {
    functions.logger.error('Update failed:', error);
    throw new functions.https.HttpsError('internal', 'Update failed');
  }
});

export const configureParserator = functions.https.onCall(async (data, context) => {
  functions.logger.info('Configuring Parserator Data Transformer extension');
  
  const configInfo = {
    collectionPath: config.collectionPath,
    inputField: config.inputField,
    outputCollection: config.outputCollection,
    preserveOriginal: config.preserveOriginal,
    errorCollection: config.errorCollection,
    version: '1.0.0'
  };
  
  functions.logger.info('Current configuration:', configInfo);
  
  return { success: true, configuration: configInfo };
});

// Health check function
export const healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Test Parserator API
    const testResult = await parserator.parse('Hello world', { message: 'string' });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apiResponse: !!testResult,
      configuration: {
        collectionPath: config.collectionPath,
        outputCollection: config.outputCollection,
        preserveOriginal: config.preserveOriginal
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Analytics function for extension usage
export const getAnalytics = functions.https.onCall(async (data, context) => {
  try {
    const db = admin.firestore();
    
    // Get processing stats from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [successfulParsing, errors, events] = await Promise.all([
      db.collection(config.outputCollection)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get(),
      config.errorCollection ? db.collection(config.errorCollection)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get() : null,
      db.collection('_parserator_events')
        .where('timestamp', '>=', thirtyDaysAgo)
        .get()
    ]);
    
    const stats = {
      totalDocuments: successfulParsing.size,
      totalErrors: errors ? errors.size : 0,
      successRate: successfulParsing.size / (successfulParsing.size + (errors ? errors.size : 0)),
      averageAccuracy: 0,
      averageProcessingTime: 0,
      period: '30 days'
    };
    
    // Calculate averages
    let totalAccuracy = 0;
    let totalProcessingTime = 0;
    let validAccuracyCount = 0;
    let validTimeCount = 0;
    
    successfulParsing.forEach(doc => {
      const data = doc.data();
      if (data.accuracy && typeof data.accuracy === 'number') {
        totalAccuracy += data.accuracy;
        validAccuracyCount++;
      }
      if (data.processingTime && typeof data.processingTime === 'number') {
        totalProcessingTime += data.processingTime;
        validTimeCount++;
      }
    });
    
    if (validAccuracyCount > 0) {
      stats.averageAccuracy = totalAccuracy / validAccuracyCount;
    }
    if (validTimeCount > 0) {
      stats.averageProcessingTime = totalProcessingTime / validTimeCount;
    }
    
    return stats;
  } catch (error) {
    functions.logger.error('Analytics error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get analytics');
  }
});
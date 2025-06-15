// packages/api/src/services/webhookService.ts
import * as admin from 'firebase-admin';
import crypto from 'crypto'; // For HMAC signature
import axios from 'axios'; // For sending HTTP requests
import { Webhook, WebhookEventName } from '../models'; // Adjust path
import { User } from '../models'; // For user context if needed

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const webhooksCollection = db.collection('webhooks');

const WEBHOOK_SIGNATURE_HEADER = 'X-Parserator-Signature-256';
const MAX_WEBHOOK_RETRIES = 3; // Example retry count
const RETRY_DELAY_MS = 1000 * 60; // Example 1 minute delay

/**
 * Generates a secure secret key for a webhook.
 */
function generateSecretKey(): string {
  return 'whsec_' + crypto.randomBytes(24).toString('hex'); // "whsec_" prefix + 48 hex chars
}

/**
 * Creates a new webhook configuration in Firestore.
 * @param userId The ID of the user creating the webhook.
 * @param targetUrl The URL to send webhooks to.
 * @param eventNames Array of event names to subscribe to.
 * @returns Promise<Webhook & { id: string }> The created webhook object.
 */
export async function createWebhook(
  userId: string,
  targetUrl: string,
  eventNames: WebhookEventName[]
): Promise<Webhook & { id: string }> {
  if (!targetUrl || !URL.canParse(targetUrl)) { // Basic URL validation
     throw new Error('Invalid target URL for webhook.');
  }
  if (!eventNames || eventNames.length === 0) {
     throw new Error('At least one event name must be subscribed to.');
  }

  const newWebhookData: Webhook = {
    userId,
    targetUrl,
    eventNames,
    secretKey: generateSecretKey(),
    createdAt: admin.firestore.Timestamp.now(),
    isActive: true,
  };
  const webhookRef = await webhooksCollection.add(newWebhookData);
  return { ...newWebhookData, id: webhookRef.id };
}

/**
 * Lists active webhooks for a given user.
 * @param userId The user's ID.
 * @returns Promise<(Webhook & { id: string })[]>
 */
export async function listUserWebhooks(userId: string): Promise<(Webhook & { id: string })[]> {
  const snapshot = await webhooksCollection
    .where('userId', '==', userId)
    .where('isActive', '==', true) // Only list active ones
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webhook & { id: string }));
}

/**
 * Deletes a webhook.
 * @param webhookId The ID of the webhook to delete.
 * @param userId The ID of the user attempting to delete (for ownership verification).
 * @returns Promise<void>
 */
export async function deleteWebhook(webhookId: string, userId: string): Promise<void> {
     const webhookRef = webhooksCollection.doc(webhookId);
     const doc = await webhookRef.get();
     if (!doc.exists) {
         throw new Error('Webhook not found.');
     }
     const webhookData = doc.data() as Webhook;
     if (webhookData.userId !== userId) {
         throw new Error('Forbidden: You do not own this webhook.');
     }
     await webhookRef.delete();
}


/**
 * Dispatches a webhook event to all subscribed webhooks for a user.
 * @param userId The ID of the user who triggered the event.
 * @param eventName The name of the event.
 * @param payload The data payload for the event.
 * @param jobId Optional: An identifier for the job that triggered this event (e.g., parse job ID).
 */
export async function dispatchWebhookEvent(
  userId: string,
  eventName: WebhookEventName,
  payload: any,
  jobId?: string
): Promise<void> {
  console.log(`Dispatching event '${eventName}' for user '${userId}' with jobId '${jobId || 'N/A'}'`);
  const snapshot = await webhooksCollection
    .where('userId', '==', userId)
    .where('eventNames', 'array-contains', eventName)
    .where('isActive', '==', true)
    .get();

  if (snapshot.empty) {
    console.log(`No active webhooks found for user '${userId}' and event '${eventName}'.`);
    return;
  }

  const eventData = {
    eventId: `evt_${uuidv4()}`, // Generate a unique event ID
    timestamp: new Date().toISOString(),
    eventName,
    jobId,
    data: payload,
  };
  const eventJson = JSON.stringify(eventData);

  for (const doc of snapshot.docs) {
    const webhook = { id: doc.id, ...doc.data() } as Webhook & { id: string };
    const signature = crypto
      .createHmac('sha256', webhook.secretKey)
      .update(eventJson)
      .digest('hex');

    console.log(`Sending webhook to ${webhook.targetUrl} for event ${eventName}, webhook ID ${webhook.id}`);

    // Non-blocking dispatch attempts with retries (could be moved to a Cloud Task for more robustness)
    sendWithRetries(webhook, eventJson, signature, 0, doc.ref).catch(error => {
        console.error(`Webhook ${webhook.id} failed permanently for event ${eventName}:`, error);
    });
  }
}

async function sendWithRetries(webhook: Webhook & {id: string}, jsonPayload: string, signature: string, attempt: number, webhookDocRef: admin.firestore.DocumentReference): Promise<void> {
    try {
        await axios.post(webhook.targetUrl, jsonPayload, {
            headers: {
                'Content-Type': 'application/json',
                [WEBHOOK_SIGNATURE_HEADER]: signature,
            },
            timeout: 10000, // 10 second timeout
        });
        console.log(`Webhook ${webhook.id} to ${webhook.targetUrl} succeeded on attempt ${attempt + 1}.`);
        await webhookDocRef.update({ lastDispatchAt: admin.firestore.Timestamp.now() });
    } catch (error: any) {
        console.error(`Webhook ${webhook.id} to ${webhook.targetUrl} failed on attempt ${attempt + 1}:`, error.message);
        await webhookDocRef.update({ lastFailureAt: admin.firestore.Timestamp.now() });

        if (attempt < MAX_WEBHOOK_RETRIES) {
            console.log(`Retrying webhook ${webhook.id} in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return sendWithRetries(webhook, jsonPayload, signature, attempt + 1, webhookDocRef);
        } else {
            console.error(`Webhook ${webhook.id} to ${webhook.targetUrl} failed after ${MAX_WEBHOOK_RETRIES + 1} attempts.`);
            // Optionally: mark webhook as inactive or notify user
            // await webhookDocRef.update({ isActive: false });
            throw new Error(`Webhook failed after ${MAX_WEBHOOK_RETRIES + 1} attempts.`);
        }
    }
}
// Helper for UUID generation for event IDs
import { v4 as uuidv4 } from 'uuid';

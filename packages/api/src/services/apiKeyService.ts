// packages/api/src/services/apiKeyService.ts
import * as admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // Using v4 for broader compatibility, can be specific if needed
import { User, ApiKey } from '../models'; // Adjust path as needed

const SALT_ROUNDS = 10;
// API_KEY_LENGTH is for the random part of the key, not the total length with prefix
const API_KEY_RANDOM_PART_LENGTH = 32;

// Initialize Firebase Admin SDK if not already initialized
// This guard is essential for Firebase Functions environments
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const usersCollection = db.collection('users');
const apiKeysCollection = db.collection('apiKeys');

/**
 * Generates a new API key string (e.g., pk_live_xxxxxxxx) and its hashed version.
 * @param isLiveKey - True for 'pk_live_', false for 'pk_test_'.
 * @returns Promise<{ apiKey: string, hashedKey: string, keyPrefix: string }>
 */
export async function generateApiKeyString(isLiveKey: boolean): Promise<{ apiKey: string, hashedKey: string, keyPrefix: string }> {
  const prefix = isLiveKey ? 'pk_live_' : 'pk_test_';
  // Generate a cryptographically secure random string
  // Using simple random char selection for brevity in this example.
  // For production, consider 'crypto.randomBytes(length).toString('hex')' or similar,
  // ensuring the character set is URL-safe or as required.
  let randomPart = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < API_KEY_RANDOM_PART_LENGTH; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const apiKey = prefix + randomPart;
  const hashedKey = await bcrypt.hash(apiKey, SALT_ROUNDS);
  return { apiKey, hashedKey, keyPrefix: prefix };
}

/**
 * Creates a new user in Firestore.
 * @param email User's email.
 * @param subscriptionTier User's subscription tier.
 * @returns Promise<User & { id: string }> The created user object with its ID.
 */
export async function createUser(email: string, subscriptionTier: User['subscriptionTier'] = 'free'): Promise<User & { id: string }> {
  const now = admin.firestore.Timestamp.now();
  const newUser: User = {
    email,
    subscriptionTier,
    monthlyUsage: {
      count: 0,
      lastReset: now,
    },
    createdAt: now,
    isActive: true,
  };
  const userRef = await usersCollection.add(newUser);
  return { ...newUser, id: userRef.id };
}

/**
 * Creates and stores a new API key for a user.
 * @param userId The ID of the user.
 * @param keyName A friendly name for the key.
 * @param isLiveKey Whether it's a live or test key.
 * @param tierWhenCreated The user's tier at the time of key creation.
 * @returns Promise<{ apiKeyString: string, apiKeyDocument: ApiKey & { id: string } }> The full API key string and the stored ApiKey document.
 */
export async function createApiKey(userId: string, keyName: string, isLiveKey: boolean, tierWhenCreated: User['subscriptionTier']): Promise<{ apiKeyString: string, apiKeyDocument: ApiKey & { id: string } }> {
  const { apiKey, hashedKey, keyPrefix } = await generateApiKeyString(isLiveKey);
  const now = admin.firestore.Timestamp.now();

  const newApiKeyData: ApiKey = { // Use a different name to avoid confusion with the interface
    userId,
    keyHash: hashedKey,
    keyPrefix,
    name: keyName,
    createdAt: now,
    isActive: true,
    tierWhenCreated,
  };
  const apiKeyRef = await apiKeysCollection.add(newApiKeyData);
  return { apiKeyString: apiKey, apiKeyDocument: { ...newApiKeyData, id: apiKeyRef.id } };
}

/**
 * Validates an API key string by comparing it against stored hashed keys.
 * @param providedApiKey The API key string from the Authorization header.
 * @returns Promise<(ApiKey & { id: string }) | null> The ApiKey document if valid and active, otherwise null.
 */
export async function validateApiKey(providedApiKey: string): Promise<(ApiKey & { id: string }) | null> {
  if (!providedApiKey || (!providedApiKey.startsWith('pk_live_') && !providedApiKey.startsWith('pk_test_'))) {
    console.warn('Invalid API key format received.');
    return null;
  }

  // It's not efficient to query all keys. A more scalable approach might involve indexing part of the hash
  // or having a separate lookup if prefixes are not enough to narrow down significantly.
  // For this implementation, we query by prefix and then bcrypt.compare.
  const keyPrefixToQuery = providedApiKey.startsWith('pk_live_') ? 'pk_live_' : 'pk_test_';
  const querySnapshot = await apiKeysCollection.where('keyPrefix', '==', keyPrefixToQuery).get();

  if (querySnapshot.empty) {
    console.warn(`No API keys found with prefix: ${keyPrefixToQuery}`);
    return null;
  }

  for (const doc of querySnapshot.docs) {
    const apiKeyDoc = { id: doc.id, ...doc.data() } as ApiKey & { id: string }; // Cast to include Firestore ID
    if (apiKeyDoc.isActive && (await bcrypt.compare(providedApiKey, apiKeyDoc.keyHash))) {
      // Optionally update lastUsedAt, but be mindful of write costs on Firestore
      // Consider doing this update asynchronously or batched if high traffic.
      // await apiKeysCollection.doc(doc.id).update({ lastUsedAt: admin.firestore.Timestamp.now() });
      return apiKeyDoc;
    }
  }
  console.warn(`No active API key matched the provided string after checking all keys with prefix ${keyPrefixToQuery}.`);
  return null;
}

/**
 * Fetches a user by their ID.
 * @param userId The user's ID.
 * @returns Promise<(User & { id: string }) | null> The User document if found and active, otherwise null.
 */
export async function getUserById(userId: string): Promise<(User & { id: string }) | null> {
  const userDocRef = usersCollection.doc(userId);
  const userDocSnapshot = await userDocRef.get(); // Renamed for clarity
  if (!userDocSnapshot.exists) {
    console.warn(`User not found with ID: ${userId}`);
    return null;
  }
  const userData = userDocSnapshot.data() as User;
  if (!userData.isActive) {
     console.warn(`User ${userId} is inactive.`);
     return null; // Or handle as a specific type of error/status
  }
  return { id: userDocSnapshot.id, ...userData };
}

/**
 * Lists all API keys for a specific user.
 * Does not return the full key string or hash for security.
 * @param userId The ID of the user.
 * @returns Promise<Partial<ApiKey & { id: string }>[]> An array of API key metadata.
 */
export async function listApiKeysForUser(userId: string): Promise<Partial<ApiKey & { id: string }>[]> {
  const querySnapshot = await apiKeysCollection.where('userId', '==', userId).get();
  if (querySnapshot.empty) {
    return [];
  }
  // Return only non-sensitive fields
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as ApiKey;
    return {
      id: doc.id,
      name: data.name,
      keyPrefix: data.keyPrefix,
      createdAt: data.createdAt,
      isActive: data.isActive,
      tierWhenCreated: data.tierWhenCreated,
      // lastUsedAt: data.lastUsedAt, // Optional: include if you add this field
    };
  });
}

/**
 * Deletes an API key for a user, ensuring ownership.
 * @param keyId The ID of the API key to delete.
 * @param userId The ID of the user requesting deletion.
 * @returns Promise<void>
 * @throws Error if the key is not found or the user does not own the key.
 */
export async function deleteApiKeyForUser(keyId: string, userId: string): Promise<void> {
  const apiKeyRef = apiKeysCollection.doc(keyId);
  const doc = await apiKeyRef.get();

  if (!doc.exists) {
    throw new Error('API key not found.');
  }

  const apiKeyData = doc.data() as ApiKey;
  if (apiKeyData.userId !== userId) {
    throw new Error('Forbidden: User does not own this API key.');
  }

  await apiKeyRef.delete();
  // Optionally, you might want to log this action or perform other cleanup.
}

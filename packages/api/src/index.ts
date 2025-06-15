import * as functions from 'firebase-functions';
import app from './app';

// Export the Express app as a Firebase Function
// This will make it available at the /api endpoint defined in firebase.json
export const api = functions.https.onRequest(app);

// You can add more Firebase Functions here if needed, for example, for scheduled tasks:
// export const scheduledFunction = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
//   console.log('This will be run every 24 hours!');
//   // Add your task logic here
//   return null;
// });

// Export scheduled functions
import { resetMonthlyUsage as resetMonthlyUsageFunction } from './scheduled/resetUsage'; // Alias import
export const resetMonthlyUsage = resetMonthlyUsageFunction; // Export with the desired name

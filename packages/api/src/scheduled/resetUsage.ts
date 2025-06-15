// packages/api/src/scheduled/resetUsage.ts
import * as functions from 'firebase-functions/v1'; // Explicitly use v1 for .schedule
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const resetMonthlyUsage = functions.pubsub
  // Schedule to run, e.g., on the 1st day of the month at 00:00
  // Note: Firebase scheduler uses App Engine cron.yaml format.
  // '0 0 1 * *' means "at 00:00 on day-of-month 1".
  .schedule('0 0 1 * *')
  // .timeZone('America/New_York') // Optional: specify timezone
  .onRun(async (context) => {
    console.log('Starting monthly usage reset for all users.');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('No users found to reset usage.');
      return null;
    }

    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    snapshot.forEach(doc => {
      // Only reset if the lastReset date is actually in a previous month.
      // This prevents resetting multiple times if the function runs more than once on the 1st.
      const userData = doc.data() as { monthlyUsage?: { lastReset?: admin.firestore.Timestamp } }; // Type assertion
      let shouldReset = true;
      if (userData.monthlyUsage && userData.monthlyUsage.lastReset) {
         const lastResetDate = userData.monthlyUsage.lastReset.toDate();
         const currentDate = now.toDate();
         if (lastResetDate.getFullYear() === currentDate.getFullYear() &&
             lastResetDate.getMonth() === currentDate.getMonth()) {
             console.log(`Skipping reset for user ${doc.id}, already reset this month.`);
             shouldReset = false;
         }
      }

      if (shouldReset) {
         console.log(`Resetting usage for user ${doc.id}`);
         batch.update(doc.ref, {
             'monthlyUsage.count': 0,
             'monthlyUsage.lastReset': now
         });
      }
    });

    try {
      const writeResults = await batch.commit();
      console.log(`Monthly usage successfully reset for ${writeResults.length} users (or skipped if already reset).`);
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
    }
    return null;
  });

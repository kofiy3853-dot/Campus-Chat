import * as admin from 'firebase-admin';

let serviceAccount: any;
try {
  serviceAccount = require('../../firebase-service-account.json');
  console.log('[Firebase] Loaded credentials from local JSON file');
} catch (error) {
  // If file is missing, try to build from environment variables
  if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    console.log('[Firebase] Found environment variables, attempting initialization');
  }
}

if (serviceAccount && (serviceAccount.projectId || serviceAccount.project_id)) {
  try {
    // Only initialize if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('[Firebase] Admin SDK initialized successfully');
    }
  } catch (initError: any) {
    console.error('[Firebase] Initialization failed:', initError.message);
  }
} else {
  console.warn('[Firebase] Service Account credentials not found. Push notifications disabled.');
}

export default admin;

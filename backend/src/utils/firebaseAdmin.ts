import * as admin from 'firebase-admin';

let serviceAccount: any;
try {
  serviceAccount = require('../../firebase-service-account.json');
} catch (error) {
  // If file is missing, try to build from environment variables
  if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
  }
}

if (serviceAccount && (serviceAccount.projectId || serviceAccount.project_id)) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (initError: any) {
    console.error('Firebase Admin initialization failed:', initError.message);
  }
} else {
  console.warn('Firebase Service Account not found. Push notifications will be disabled.');
}

export default admin;

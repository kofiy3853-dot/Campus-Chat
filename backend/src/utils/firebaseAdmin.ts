import * as admin from 'firebase-admin';

// Replace the placeholder below with the path to your service account JSON file
// or initialize with environment variables.
// Example for initialization with a JSON file:
// const serviceAccount = require("./path/to/serviceAccountKey.json");

// Example for initialization with env vars (recommended for production):
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString())
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} else {
  console.warn('Firebase Service Account not found. Push notifications will be disabled.');
}

export default admin;

import * as admin from 'firebase-admin';

const serviceAccount = require('../../firebase-service-account.json');

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} else {
  console.warn('Firebase Service Account not found. Push notifications will be disabled.');
}

export default admin;

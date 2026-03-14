import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// Replace these placeholders with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyAgBukQdNz0y9MpMGc4q24C77VAMVUkJn8",
  authDomain: "campus-chat-fcbcb.firebaseapp.com",
  projectId: "campus-chat-fcbcb",
  storageBucket: "campus-chat-fcbcb.firebasestorage.app",
  messagingSenderId: "369950817039",
  appId: "1:369950817039:web:81102cb3161c665b0e1c7a",
  measurementId: "G-7DELY2NXVX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

export default app;

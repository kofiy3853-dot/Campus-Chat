import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4q_nhQcWPTWPw8gHuathgTBey45z-HEE",
  authDomain: "campus-networking.firebaseapp.com",
  projectId: "campus-networking",
  storageBucket: "campus-networking.firebasestorage.app",
  messagingSenderId: "1029468422967",
  appId: "1:1029468422967:web:5228f551599d8164b110b2",
  measurementId: "G-96V2XXQF36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Cloud Messaging conditionally
export const messaging = async () => {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
};

export default app;

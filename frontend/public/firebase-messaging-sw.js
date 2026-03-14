importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Replace these placeholders with your actual Firebase config values
firebase.initializeApp({
  apiKey: "AIzaSyAgBukQdNz0y9MpMGc4q24C77VAMVUkJn8",
  authDomain: "campus-chat-fcbcb.firebaseapp.com",
  projectId: "campus-chat-fcbcb",
  storageBucket: "campus-chat-fcbcb.firebasestorage.app",
  messagingSenderId: "369950817039",
  appId: "1:369950817039:web:81102cb3161c665b0e1c7a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Replace with your icon path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 1. Firebase Messaging Service Worker
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Firebase Service Worker registered:', registration.scope);
      })
      .catch((err) => {
        console.log('Firebase Service Worker failed:', err);
      });

    // 2. Offline Cache Service Worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Offline Service Worker registered:', registration.scope);
      })
      .catch((err) => {
        console.log('Offline Service Worker failed:', err);
      });
  });
}

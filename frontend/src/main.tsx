import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Global handler for chunk loading errors (typical after new deployments)
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('Failed to fetch dynamically imported module') || 
      message.includes('MIME type') ||
      (event.target && (event.target as any).src && (event.target as any).src.includes('/assets/'))) {
    
    // Use a small delay and a session flag to avoid infinite reload loops
    const reloadKey = 'last-reload-failed-chunk';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem(reloadKey, now.toString());
      console.warn('Chunk load error detected. Forcing page refresh to fetch latest assets...');
      window.location.reload();
    }
  }
}, true);

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

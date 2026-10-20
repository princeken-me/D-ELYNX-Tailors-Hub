import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely register service worker when not in a restricted sandbox or iframe
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const isInsideIframe = window.self !== window.top;
    if (!isInsideIframe) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((err) => {
            // Gracefully catch any security or network restrictions
            console.debug('ServiceWorker registration deferred:', err?.message || err);
          });
      });
    }
  } catch {
    // In strict sandbox iframes, window.top access may be restricted
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

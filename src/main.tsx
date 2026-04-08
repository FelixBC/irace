import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';
import { isWebPushConfigured, registerWebPushServiceWorker } from './lib/pushNotifications';

if (isWebPushConfigured()) {
  registerWebPushServiceWorker().catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

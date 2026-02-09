import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from '@/app/App';
import '@/assets/styles.css';


import { initializeApiConfig } from '@/app/core/api/apiConfig';

const initApp = async () => {
  try {
    // Wait for config with 1 second timeout to prevent white screen
    await Promise.race([
      initializeApiConfig(),
      new Promise(resolve => setTimeout(resolve, 1000))
    ]);
  } catch (err) {
    console.error('Failed to initialize API config:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <HashRouter>
      <App />
    </HashRouter>
  );
};

initApp();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from '@/app/App';
import '@/assets/styles.css';


// Patch fetch for Electron environment (file:// protocol) to redirect /api requests to backend
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}:${import.meta.env.VITE_API_PORT}`;

if (window.location.protocol === 'file:') {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = input;
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = API_BASE_URL + url;
    } else if (url instanceof URL && url.pathname.startsWith('/api')) {
      url = new URL(url.pathname, API_BASE_URL);
    }
    return originalFetch(url, init);
  };
  console.log(`[Renderer] Fetch patched for Electron API redirection to ${API_BASE_URL}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
);

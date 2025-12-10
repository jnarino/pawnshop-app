import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store } from '@/app/core/redux/store';
import App from '@/app/App';
import '@/assets/styles.css';


// Patch fetch for Electron environment (file:// protocol) to redirect /api requests to localhost:3000
if (window.location.protocol === 'file:') {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = input;
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = 'http://localhost:3001' + url;
    } else if (url instanceof URL && url.pathname.startsWith('/api')) {
      url = new URL(url.pathname, 'http://localhost:3001');
    }
    return originalFetch(url, init);
  };
  console.log('[Renderer] Fetch patched for Electron API redirection');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>
);

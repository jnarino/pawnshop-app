import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom'; // changed
import { store } from '@/app/core/redux/store';
import App from '@/app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>
);

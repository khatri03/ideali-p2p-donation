import './polyfills';
import './assets/css/App.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import { ErrorBoundary } from './app/components/common/ErrorBoundary';
import { GOOGLE_CLIENT_ID } from './utils/env';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root is missing from index.html.');
}

const root = ReactDOM.createRoot(container);

root.render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID ?? ''}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </GoogleOAuthProvider>
  </ErrorBoundary>,
);

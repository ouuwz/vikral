import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/home.css';
import './styles/brands.css';
import './styles/detection.css';
import './styles/social-monitoring.css';
import './styles/app-monitoring.css';
import './styles/dashboard.css';
import './styles/integrations.css';
import './styles/analysis-result.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

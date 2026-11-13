import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.jsx';
import { ProvedoresFeedback } from './components/feedback/index.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProvedoresFeedback>
      <App />
    </ProvedoresFeedback>
  </StrictMode>,
);

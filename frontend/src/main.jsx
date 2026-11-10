import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ProvedorAvisos, ProvedorConfirmacao } from './components/ui.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProvedorAvisos>
      <ProvedorConfirmacao>
        <App />
      </ProvedorConfirmacao>
    </ProvedorAvisos>
  </StrictMode>,
);

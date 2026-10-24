import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In AI Studio iFrame / Cloud Run preview, HMR WebSocket is disabled or proxied.
// Ignore Vite dev WebSocket transport errors per environment guidelines.
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('WebSocket') ||
    event.filename?.includes('@vite/client') ||
    event.message?.includes('createWebSocketModuleRunnerTransport')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason?.message || event.reason?.stack || event.reason || '');
  if (
    reasonStr.includes('WebSocket') ||
    reasonStr.includes('@vite/client') ||
    reasonStr.includes('createWebSocketModuleRunnerTransport')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

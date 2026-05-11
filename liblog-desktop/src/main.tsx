/**
 * main.tsx
 * --------
 * Application entry point.
 * Imports global styles (Tailwind + CCC design tokens) before mounting React.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

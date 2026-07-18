import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/manrope';
import '@fontsource/dm-serif-display/400.css';
import { App } from './App.jsx';
import './styles.css';

registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('lupa:offline-ready'));
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { connect } from './vendor/espacio-sdk/index.js';

import './index.css';
import App from './App';

// Si Por Hacer está alojada en espacio, el escritorio le presta la sesión del
// socio y un fetch acotado a su carpeta del pod. Fuera de espacio, `connect`
// devuelve null y la app sigue funcionando exactamente como siempre: el mismo
// build sirve para los dos casos.
window.__espacio = await connect().catch(() => null);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

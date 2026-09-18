import React from 'react';
import ReactDOM from 'react-dom/client';
import { Client as Styletron } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { DarkTheme, BaseProvider } from "baseui";

import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
const engine = new Styletron();

root.render(
  <React.StrictMode>
    <StyletronProvider value={engine}>
      <BaseProvider theme={DarkTheme}>
        <App />
      </BaseProvider>
    </StyletronProvider>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { FinancialProvider } from './context/FinancialContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <FinancialProvider>
            <App />
          </FinancialProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

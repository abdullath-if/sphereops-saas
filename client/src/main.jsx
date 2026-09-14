import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);

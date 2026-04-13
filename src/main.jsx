import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from './ToastContext'; // Importe o provedor ToastProvider

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider> {/* Envolva o App com o ToastProvider */}
      <App />
    </ToastProvider>
  </React.StrictMode>,
);
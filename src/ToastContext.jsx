import React, { createContext, useState, useContext, useCallback } from "react";
import Toast from "./Toast"; // Importe seu componente Toast

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState({
    message: "",
    type: "info",
    show: false,
  });

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    setToastState({ message, type, show: true });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast {...toastState} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

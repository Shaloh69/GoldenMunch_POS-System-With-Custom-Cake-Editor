"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      handleExit();
    }, toast.duration || 4000);

    return () => clearTimeout(timeout);
  }, []);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-green-500/95",
          icon: "✅",
          border: "border-green-400",
        };
      case "error":
        return {
          bg: "bg-red-500/95",
          icon: "❌",
          border: "border-red-400",
        };
      case "warning":
        return {
          bg: "bg-golden-orange/95",
          icon: "⚠️",
          border: "border-deep-amber",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-500/95",
          icon: "ℹ️",
          border: "border-blue-400",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out pointer-events-auto
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
      onClick={handleExit}
    >
      <Card
        className={`
          ${styles.bg} backdrop-blur-xl border-2 ${styles.border}
          shadow-2xl cursor-pointer hover:scale-105 transition-transform
        `}
      >
        <CardBody className="px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce-slow">{styles.icon}</span>
            <p className="text-white font-semibold text-lg">{toast.message}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Hook to manage toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration?: number,
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string, duration?: number) =>
      showToast(message, "success", duration),
    error: (message: string, duration?: number) =>
      showToast(message, "error", duration),
    warning: (message: string, duration?: number) =>
      showToast(message, "warning", duration),
    info: (message: string, duration?: number) =>
      showToast(message, "info", duration),
  };
};

export default Toast;

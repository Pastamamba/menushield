import { useState, useEffect } from "react";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-yellow-900",
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${typeStyles[type]} px-4 py-3 rounded-lg shadow-lg animate-slide-in max-w-sm`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="ml-auto text-current opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (toast: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id,
      onClose: () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

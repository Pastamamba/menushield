import React, { useState, useEffect } from "react";
import { offlineManager } from "../utils/offlineManager";

interface OfflineNotificationProps {
  show: boolean;
  onRefresh?: () => void;
}

export default function OfflineNotification({
  show,
  onRefresh,
}: OfflineNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (show) {
      setDismissed(false);
    }
  }, [show]);

  if (!show || dismissed) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg animate-slide-in-down">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse-slow">📱</span>
          <div>
            <p className="font-medium">You're currently offline</p>
            <p className="text-sm">
              Some features may be limited. Showing cached menu data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-900 hover:text-yellow-800 p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// Online notification for when connection is restored
export function OnlineNotification({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in">
      <div className="flex items-center gap-2">
        <span className="text-lg">✅</span>
        <div>
          <p className="font-medium">Back online!</p>
          <p className="text-sm">Menu data updated</p>
        </div>
      </div>
    </div>
  );
}

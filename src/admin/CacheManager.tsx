import React, { useState, useEffect } from "react";
import { offlineManager } from "../utils/offlineManager";

export default function CacheManager() {
  const [cacheStatus, setCacheStatus] = useState({
    hasMenuCache: false,
    cacheSize: 0,
    lastUpdate: undefined as Date | undefined,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCacheStatus();

    const unsubscribe = offlineManager.addListener((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  const loadCacheStatus = async () => {
    try {
      const status = await offlineManager.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error("Failed to load cache status:", error);
    }
  };

  const handleClearCache = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all cached data? This will remove offline menu access for guests."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await offlineManager.clearCache();
      await loadCacheStatus();
      alert("Cache cleared successfully!");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      alert("Failed to clear cache. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    setLoading(true);
    try {
      await offlineManager.requestBackgroundSync();
      setTimeout(loadCacheStatus, 1000); // Wait a bit for sync to complete
      alert("Cache refresh requested!");
    } catch (error) {
      console.error("Failed to refresh cache:", error);
      alert("Failed to refresh cache. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Offline & Cache Management</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Panel */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Current Status</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm">{isOnline ? "Online" : "Offline"}</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  cacheStatus.hasMenuCache ? "bg-blue-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm">
                Menu Cache:{" "}
                {cacheStatus.hasMenuCache ? "Available" : "Not cached"}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              Cached Items: {cacheStatus.cacheSize}
            </div>

            {cacheStatus.lastUpdate && (
              <div className="text-sm text-gray-600">
                Last Update: {cacheStatus.lastUpdate.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Actions</h4>
          <div className="space-y-3">
            <button
              onClick={handleRefreshCache}
              disabled={loading || !isOnline}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Refresh Cache"}
            </button>

            <button
              onClick={handleClearCache}
              disabled={loading}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Clear Cache"}
            </button>

            <button
              onClick={loadCacheStatus}
              disabled={loading}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Refresh Status"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-2">
          How Offline Mode Works
        </h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Guest menus are automatically cached when accessed</li>
          <li>• Offline guests can still filter and browse cached menus</li>
          <li>• Cache refreshes automatically when connection is restored</li>
          <li>• Clearing cache removes offline access for guests</li>
        </ul>
      </div>
    </div>
  );
}

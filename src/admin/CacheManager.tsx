import { useState } from "react";

export default function CacheManager() {
  const [cacheStatus] = useState({
    hasMenuCache: false,
    cacheSize: 0,
    lastUpdate: undefined as Date | undefined,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Cache Manager</h2>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Status</h3>
        <div className="space-y-2">
          <p>Menu Cache: {cacheStatus.hasMenuCache ? "Active" : "Inactive"}</p>
          <p>Cache Size: {cacheStatus.cacheSize} items</p>
          <p>Last Update: {cacheStatus.lastUpdate?.toLocaleString() || "Never"}</p>
        </div>
      </div>
    </div>
  );
}

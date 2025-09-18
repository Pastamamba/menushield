// src/admin/AdminMenu.tsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import DishManager from "./DishManager";
import QRCodeManager from "./QRCodeManager";
import CacheManager from "./CacheManager";
import IngredientManager from "./IngredientManager";

type TabType = "dishes" | "qr-code" | "settings";

export default function AdminMenu() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dishes");

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "dishes", label: "Manage Dishes", icon: "🍽️" },
    { id: "qr-code", label: "QR Code & Sharing", icon: "📱" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">MenuShield Admin</h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeTab === "dishes" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <DishManager />
          </div>
        )}

        {activeTab === "qr-code" && <QRCodeManager />}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-6">
                Restaurant Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your Restaurant Name"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Description
                  </label>
                  <textarea
                    placeholder="Brief description of your restaurant"
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    placeholder="Phone number or email"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Save Settings
                </button>
              </div>
            </div>

            <CacheManager />
          </div>
        )}
      </main>
    </div>
  );
}

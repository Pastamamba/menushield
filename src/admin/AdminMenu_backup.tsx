// src/admin/AdminMenu.tsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import DishManager from "./DishManager";
import IngredientManager from "./IngredientManager";
import QRCodeManager from "./QRCodeManager";
import CacheManager from "./CacheManager";

type TabType = "dashboard" | "dishes" | "ingredients" | "qr-code" | "settings";

export default function AdminMenu() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "dishes", label: "Dishes", icon: "🍽️" },
    { id: "ingredients", label: "Ingredients", icon: "🥬" },
    { id: "qr-code", label: "QR Code", icon: "📱" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">MenuShield</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                activeTab === item.id
                  ? "bg-green-50 text-green-700 border-r-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "dishes" && <DishManager />}
          {activeTab === "ingredients" && <IngredientManager token="" />}
          {activeTab === "qr-code" && <QRCodeManager />}
          {activeTab === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// Quick Dashboard Component
function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Dishes</p>
              <p className="text-2xl font-semibold">-</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🥬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ingredients</p>
              <p className="text-2xl font-semibold">-</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Allergens</p>
              <p className="text-2xl font-semibold">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl block mb-2">➕</span>
            <span className="text-sm">Add Dish</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl block mb-2">🥬</span>
            <span className="text-sm">Add Ingredient</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl block mb-2">📱</span>
            <span className="text-sm">Generate QR</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl block mb-2">📤</span>
            <span className="text-sm">Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings Component
function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Your Restaurant Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Restaurant address"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="space-y-4">
          <CacheManager />
        </div>
      </div>
    </div>
  );
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

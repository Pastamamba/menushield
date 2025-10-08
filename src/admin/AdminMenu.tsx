// src/admin/AdminMenu.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useRestaurant } from "../contexts/RestaurantContext";
import RestaurantSwitcher from "../components/RestaurantSwitcher";
import DishManager from "./DishManager";
import QRCodeManager from "./QRCodeManager";
import CacheManager from "./CacheManager";
import RestaurantSettings from "./RestaurantSettings";

type TabType = "dashboard" | "qr-code" | "restaurant" | "settings";

export default function AdminMenu() {
  const { logout } = useAuth();
  
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('admin-active-tab');
      const validTabs: TabType[] = ["dashboard", "qr-code", "restaurant", "settings"];
      if (saved && validTabs.includes(saved as TabType)) {
        return saved as TabType;
      }
    } catch (error) {
      console.log('Error reading localStorage:', error);
    }
    return "dashboard";
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-active-tab', activeTab);
  }, [activeTab]);

  const menuItems = [
    { id: "dashboard" as const, label: "Dish Management", icon: "🍽️" },
    { id: "qr-code" as const, label: "QR Code", icon: "📱" },
    { id: "restaurant" as const, label: "Restaurant", icon: "🏪" },
    { id: "settings" as const, label: "Settings", icon: "⚙️" },
  ];

  const handleMenuClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close mobile menu when item is selected
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">MenuShield</h1>
          </div>
          
          {/* Current tab indicator */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">{menuItems.find(item => item.id === activeTab)?.icon}</span>
            <span>{menuItems.find(item => item.id === activeTab)?.label}</span>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:block p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">MenuShield</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
        </div>

        {/* Restaurant Switcher */}
        <div className="p-4 border-b bg-gray-50">
          <RestaurantSwitcher />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">MenuShield</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-6 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                activeTab === item.id
                  ? "bg-green-50 text-green-700 border-r-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-6 border-t">
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Dashboard = DishManager */}
          {activeTab === "dashboard" && <DishManager />}
          {activeTab === "qr-code" && <QRCodeManager />}
          {activeTab === "restaurant" && <RestaurantSettings />}
          {activeTab === "settings" && <AdminSettings />}
        </div>
      </main>
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
}
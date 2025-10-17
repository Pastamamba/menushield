// src/admin/AdminMenu.tsx
import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "../auth/AuthContext";
import RestaurantSwitcher from "../components/RestaurantSwitcher";
import LanguageSelector from "../components/LanguageSelector";
import { LoadingShimmer } from "../components/LoadingShimmer";
import { useAdminTranslations } from "../hooks/useAdminTranslations";

// Lazy load heavy admin components for better performance
const DishManager = lazy(() => import("./DishManager"));
const IngredientAllergenManager = lazy(() => import("./IngredientAllergenManager"));
const QRCodeManager = lazy(() => import("./QRCodeManager"));
const RestaurantSettings = lazy(() => import("./RestaurantSettings"));
const AccountSettings = lazy(() => import("./AccountSettings"));

type TabType = "dashboard" | "ingredients" | "qr-code" | "restaurant" | "settings";

export default function AdminMenu() {
  const { logout } = useAuth();
  const { t } = useAdminTranslations();
  
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('admin-active-tab');
      const validTabs: TabType[] = ["dashboard", "ingredients", "qr-code", "restaurant", "settings"];
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
    { id: "dashboard" as const, label: t('dishes'), icon: "🍽️" },
    ...(import.meta.env.VITE_SHOW_INGREDIENT_MANAGER === 'true' || import.meta.env.DEV 
      ? [{ id: "ingredients" as const, label: "Ingredients", icon: "🧄" }] 
      : []),
    { id: "qr-code" as const, label: t('qrCode'), icon: "📱" },
    { id: "restaurant" as const, label: t('restaurantName'), icon: "🏪" },
    { id: "settings" as const, label: t('settings'), icon: "⚙️" },
  ];

  const handleMenuClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close mobile menu when item is selected
  };

  return (
    <div className="min-h-screen bg-warm-gray-50 flex relative">
      {/* Mobile Header - Refined and minimal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-warm-gray-200">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-md hover:bg-warm-gray-100 transition-colors mr-2"
            >
              <svg className="w-5 h-5 text-warm-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-warm-gray-800">MenuShield</h1>
          </div>
          
          {/* Current tab indicator - more subtle */}
          <div className="flex items-center text-sm text-warm-gray-600">
            <span className="mr-1.5 text-base">{menuItems.find(item => item.id === activeTab)?.icon}</span>
            <span className="font-medium">{menuItems.find(item => item.id === activeTab)?.label}</span>
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

      {/* Sidebar - More refined and compact */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white shadow-md transform transition-transform duration-300 ease-in-out border-r border-warm-gray-200
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Desktop Header - More compact */}
        <div className="hidden lg:block p-4 border-b border-warm-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-warm-gray-800">MenuShield</h1>
              <p className="text-sm text-warm-gray-500">{t('adminPanel')}</p>
            </div>
            <LanguageSelector variant="compact" />
          </div>
        </div>

        {/* Restaurant Switcher - More minimal */}
        <div className="p-3 border-b border-warm-gray-200 bg-warm-gray-50">
          <RestaurantSwitcher />
        </div>

        {/* Mobile Header - Refined */}
        <div className="lg:hidden p-3 border-b border-warm-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-warm-gray-800">MenuShield</h1>
            <p className="text-sm text-warm-gray-500">{t('adminPanel')}</p>
          </div>
          <LanguageSelector variant="compact" />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-warm-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-warm-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-4 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-warm-gray-50 transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-sage-50 text-sage-700 border-r-2 border-sage-500 font-medium"
                  : "text-warm-gray-600 hover:text-warm-gray-800"
              }`}
            >
              <span className="mr-3 text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button - More refined */}
        <div className="p-4 border-t border-warm-gray-200">
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white px-3 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium text-sm active:scale-98"
          >
            🚪 {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content - Reduced padding */}
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-3 lg:p-6">{/* More compact padding */}
          {/* Dashboard = DishManager */}
          {activeTab === "dashboard" && (
            <Suspense fallback={<LoadingShimmer />}>
              <DishManager />
            </Suspense>
          )}
          {activeTab === "ingredients" && (
            <Suspense fallback={<LoadingShimmer />}>
              <IngredientAllergenManager />
            </Suspense>
          )}
          {activeTab === "qr-code" && (
            <Suspense fallback={<LoadingShimmer />}>
              <QRCodeManager />
            </Suspense>
          )}
          {activeTab === "restaurant" && (
            <Suspense fallback={<LoadingShimmer />}>
              <RestaurantSettings />
            </Suspense>
          )}
          {activeTab === "settings" && (
            <Suspense fallback={<LoadingShimmer />}>
              <AccountSettings />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
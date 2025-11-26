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
const ProfileInformation = lazy(() => import("./ProfileInformation"));

type TabType = "dashboard" | "ingredients" | "qr-code" | "profile";

export default function AdminMenu() {
  const { logout } = useAuth();
  const { t } = useAdminTranslations();
  
  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('admin-active-tab');
      const validTabs: TabType[] = ["dashboard", "ingredients", "qr-code", "profile"];
      
      // Migrate old tab names to new structure
      if (saved === "restaurant" || saved === "settings") {
        return "profile";
      }
      
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
    { id: "profile" as const, label: "Profile", icon: "👤" },
  ];

  const handleMenuClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close mobile menu when item is selected
  };

  return (
    <div className="min-h-screen bg-warm-gray-50 flex relative">
      {/* Mobile Header - Refined and minimal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors mr-3"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-medium text-gray-900">MenuShield</h1>
          </div>
          
          {/* Current tab indicator - minimal */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2 text-base opacity-60">{menuItems.find(item => item.id === activeTab)?.icon}</span>
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

      {/* Sidebar - Minimalistic design */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out border-r border-gray-100
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Desktop Header - Clean and minimal */}
        <div className="hidden lg:block p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-light text-gray-900">MenuShield</h1>
              <p className="text-sm text-gray-500 mt-0.5">{t('adminPanel')}</p>
            </div>
            <LanguageSelector variant="compact" />
          </div>
        </div>

        {/* Restaurant Switcher - Minimal */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <RestaurantSwitcher />
        </div>

        {/* Mobile Header - Clean */}
        <div className="lg:hidden p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">MenuShield</h1>
            <p className="text-sm text-gray-500">{t('adminPanel')}</p>
          </div>
          <LanguageSelector variant="compact" />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center px-6 py-4 text-left hover:bg-gray-50 transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-gray-50 text-gray-900 border-r-2 border-gray-900 font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <span className="mr-4 text-lg opacity-60">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button - Minimal */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
          >
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content - Consistent with profile page */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 bg-gray-50">
        <div className="p-4 lg:p-8">
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
          {activeTab === "profile" && (
            <Suspense fallback={<LoadingShimmer />}>
              <ProfileInformation />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
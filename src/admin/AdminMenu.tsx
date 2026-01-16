// src/admin/AdminMenu.tsx
import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "../auth/AuthContext";
import RestaurantSwitcher from "../components/RestaurantSwitcher";
import LanguageSelector from "../components/LanguageSelector";
import { LoadingShimmer } from "../components/LoadingShimmer";
import { useAdminTranslations } from "../hooks/useAdminTranslations";

// Lazy load heavy admin components for better performance
const DishManager = lazy(() => import("./DishManager"));
const QRCodeManager = lazy(() => import("./QRCodeManager"));
const ProfileInformation = lazy(() => import("./ProfileInformation"));

type TabType = "dashboard" | "qr-code" | "profile";

export default function AdminMenu() {
  const { logout } = useAuth();
  const { t } = useAdminTranslations();

  // Initialize activeTab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem("admin-active-tab");
      const validTabs: TabType[] = ["dashboard", "qr-code", "profile"];

      // Migrate old tab names to new structure
      if (
        saved === "restaurant" ||
        saved === "settings" ||
        saved === "ingredients"
      ) {
        return "profile";
      }

      if (saved && validTabs.includes(saved as TabType)) {
        return saved as TabType;
      }
    } catch (error) {
      console.log("Error reading localStorage:", error);
    }
    return "dashboard";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("admin-active-tab", activeTab);
  }, [activeTab]);

  const menuItems = [
    { id: "dashboard" as const, label: t("dishes"), icon: "🍽️" },
    { id: "qr-code" as const, label: t("qrCode"), icon: "📱" },
    { id: "profile" as const, label: "Profile", icon: "👤" },
  ];

  const handleMenuClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close mobile menu when item is selected
  };

  return (
    <div className="min-h-screen bg-warm-gray-50 flex flex-col">
      {/* Full-width gradient header like guest menu */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Title */}
              <div>
                <h1 className="text-xl font-medium text-white">
                  MenuShield Admin
                </h1>
                <p className="text-sage-100 text-sm">{t("adminPanel")}</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="text-right text-sage-100 text-sm hidden lg:block">
                <span className="opacity-80">
                  {menuItems.find((item) => item.id === activeTab)?.icon}
                </span>
                <span className="ml-2 font-medium">
                  {menuItems.find((item) => item.id === activeTab)?.label}
                </span>
              </div>
              <LanguageSelector variant="compact" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] z-40 w-64 bg-white/95 backdrop-blur-sm lg:bg-white transform transition-transform duration-300 ease-in-out lg:border-r lg:border-gray-100 flex flex-col
          lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }
        `}
        >
          {/* Restaurant Switcher */}
          <div className="p-6 border-b border-gray-100">
            <RestaurantSwitcher />
          </div>

          <nav className="flex-1 flex flex-col p-2">
            <div className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-sage-50 transition-all duration-200 rounded-lg ${
                    activeTab === item.id
                      ? "bg-sage-100 text-sage-900 font-medium shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="mr-3 text-lg opacity-70">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-4">
              <button
                onClick={logout}
                className="w-full bg-sage-900 text-white px-4 py-3 rounded-xl hover:bg-sage-800 transition-all duration-200 font-medium text-sm shadow-sm"
              >
                {t("logout")}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Dashboard = DishManager */}
            {activeTab === "dashboard" && (
              <Suspense fallback={<LoadingShimmer />}>
                <DishManager />
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
    </div>
  );
}

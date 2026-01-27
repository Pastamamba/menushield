import { useState, useEffect, useRef } from "react";
import { useMenu } from "../utils/dishApi";
import { useRestaurant } from "../contexts/RestaurantContext";
import { analyzeDishSafety } from "../utils/dishAnalyzer";
import { useSwipeNavigation } from "../hooks/useEnhancedTouchGestures";
import { useMenuTranslations } from "../hooks/useMenuTranslations";
import LanguageSelector from "./LanguageSelector";
import AllergenFilter from "./AllergenFilter";
import DishCard from "./DishCard";
import SkeletonLoader from "./SkeletonLoader";
import AllergenDisclaimer from "./AllergenDisclaimer";
import type { Dish } from "../types";

export default function GuestMenu() {
  const { data: dishes = [], isLoading, error } = useMenu();
  const { restaurant } = useRestaurant();
  const { t, currentLanguage } = useMenuTranslations();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showAllergenDisclaimer, setShowAllergenDisclaimer] = useState(false);
  const [showWelcomeInfo, setShowWelcomeInfo] = useState(true);
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Enhanced touch gestures for mobile filter
  const swipeRef = useSwipeNavigation(
    () => setShowMobileFilter(false), // Swipe left to close
    undefined,
    75,
  );

  // Check if user has accepted the allergen disclaimer
  useEffect(() => {
    const hasAcceptedDisclaimer = localStorage.getItem(
      "allergen-disclaimer-accepted",
    );
    if (!hasAcceptedDisclaimer) {
      setShowAllergenDisclaimer(true);
    }

    // Check if user has seen welcome info before
    const hasSeenWelcomeInfo = localStorage.getItem("welcome-info-seen");
    if (hasSeenWelcomeInfo) {
      setShowWelcomeInfo(false);
    }
  }, []);

  // Check if we should show disclaimer when allergens are selected for first time
  useEffect(() => {
    if (selectedAllergens.length > 0) {
      const hasSeenAllergenDisclaimer = localStorage.getItem(
        "allergen-disclaimer-seen",
      );
      if (!hasSeenAllergenDisclaimer) {
        setShowAllergenDisclaimer(true);
        localStorage.setItem("allergen-disclaimer-seen", "true");
      }
    }
  }, [selectedAllergens]);

  const handleAllergenDisclaimerAccept = () => {
    localStorage.setItem("allergen-disclaimer-accepted", "true");
    localStorage.setItem("allergen-disclaimer-seen", "true");
    setShowAllergenDisclaimer(false);
  };

  const handleAllergenDisclaimerDecline = () => {
    // Reset allergen selections if user declines
    setSelectedAllergens([]);
    setShowAllergenDisclaimer(false);
  };

  // Close mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMobileFilter &&
        !(event.target as Element).closest('[data-drawer="mobile-filter"]')
      ) {
        setShowMobileFilter(false);
      }
    };

    if (showMobileFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showMobileFilter]);

  const scrollToMenu = () => {
    setShowMobileFilter(false); // Close mobile filter when showing dishes
    setTimeout(() => {
      if (menuSectionRef.current) {
        const headerHeight =
          document.querySelector(".mobile-header")?.clientHeight || 80;
        const targetPosition =
          menuSectionRef.current.offsetTop - headerHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    }, 300); // Wait for drawer close animation
  };

  // Enhanced card interactions for native mobile feel
  const handleCardSelect = (dish: any) => {
    // Could show dish details modal or add to order
    console.log("Card selected:", dish.name);
  };

  const handleCardLongPress = (dish: any) => {
    // Could show context menu or quick actions
    console.log("Card long pressed:", dish.name);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-gray-50">
        {/* Mobile Header */}
        <div className="mobile-header lg:hidden sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-medium text-white">MenuShield</h1>
                <p className="text-sage-100 text-xs flex items-center">
                  <svg
                    className="w-3 h-3 mr-1 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Loading menu...
                </p>
              </div>
              <div className="w-16 h-6 bg-white/20 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="text-center">
              <div className="h-5 bg-white/20 rounded w-48 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-white/10 rounded w-24 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 py-4">
          {/* Filter Skeleton */}
          <div className="hidden lg:block mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-100 rounded-full w-20 animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Dish Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg p-3"
              >
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-2 bg-gray-100 rounded w-full mb-1 animate-pulse"></div>
                <div className="h-2 bg-gray-100 rounded w-2/3 mb-2 animate-pulse"></div>
                <div className="flex gap-1">
                  <div className="h-5 bg-gray-100 rounded w-12 animate-pulse"></div>
                  <div className="h-5 bg-gray-100 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warm-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Menu Temporarily Unavailable
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            We're having trouble loading the menu right now. This is usually
            temporary and will be resolved shortly.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-sage-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-sage-700 transition-colors"
            >
              Try Again
            </button>
            <p className="text-xs text-gray-500">
              If the problem persists, please ask restaurant staff for
              assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get unique categories from dishes
  const availableCategories = Array.from(
    new Set(dishes.map((dish) => dish.category || "Other").filter(Boolean)),
  ).sort();

  // Filter dishes based on search term, category and active status
  let filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      searchTerm === "" ||
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" ||
      (dish.category || "Other") === selectedCategory;

    // Only show active dishes
    return dish.is_active !== false && matchesSearch && matchesCategory;
  });

  // Categorize dishes by safety level - Keep unsafe dishes visible but clearly marked
  const categorizedDishes = filteredDishes.reduce(
    (acc, dish) => {
      const safety = analyzeDishSafety(dish, selectedAllergens);
      acc[safety.status].push({ dish, safety });
      return acc;
    },
    {
      safe: [] as Array<{
        dish: Dish;
        safety: ReturnType<typeof analyzeDishSafety>;
      }>,
      unsafe: [] as Array<{
        dish: Dish;
        safety: ReturnType<typeof analyzeDishSafety>;
      }>,
    },
  );

  return (
    <div className="min-h-screen bg-warm-gray-50 flex flex-col">
      {/* Allergen Disclaimer Modal */}
      <AllergenDisclaimer
        isOpen={showAllergenDisclaimer}
        onAccept={handleAllergenDisclaimerAccept}
        onDecline={handleAllergenDisclaimerDecline}
        restaurantName={restaurant?.name || "this restaurant"}
      />
      {/* Mobile Header - Refined dining aesthetic */}
      <div className="mobile-header lg:hidden sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {restaurant?.name && (
                <>
                  <h1 className="text-base font-medium text-white">
                    {restaurant.name}
                  </h1>
                  <p className="text-sage-100 text-xs flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("safeDining")}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <LanguageSelector variant="compact" className="z-50" />
              <button
                onClick={() => setShowMobileFilter(true)}
                className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-white/30 transition-all duration-200 active:scale-98 shadow-sm"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-8.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium text-xs">{t("filter")}</span>
                {(selectedAllergens.length > 0 ||
                  selectedCategory !== "all") && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] font-semibold">
                    {selectedAllergens.length +
                      (selectedCategory !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header - More refined and minimal */}
      <div className="hidden lg:block sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center">
              <div className="flex items-center text-sage-100 text-xs">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Allergen Menu
              </div>
            </div>
            <div className="text-center">
              {restaurant?.name && (
                <>
                  <h1 className="text-xl font-medium text-white mb-0.5">
                    {restaurant.name}
                  </h1>
                  <div className="flex items-center justify-center text-sage-100 text-xs">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("safeDining")}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageSelector variant="compact" className="z-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilter && (
        <>
          {/* Backdrop */}
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity animate-fade-in" />

          {/* Drawer */}
          <div
            ref={swipeRef as any}
            data-drawer="mobile-filter"
            className="lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform translate-x-0 animate-slide-in-right"
            style={{
              animationDuration: "0.3s",
              animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header - Clean minimal design matching admin */}
              <div className="p-4 border-b border-sage-200 bg-gradient-to-r from-sage-600 to-sage-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {t("filterMenu")}
                    </h2>
                    <p className="text-sage-100 mt-0.5 text-sm">
                      {t("findSafeDishes")}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMobileFilter(false)}
                    className="p-2 rounded-md hover:bg-white/20 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-warm-gray-50 space-y-6">
                {/* Category Filter */}
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t("category") || "Category"}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="all">
                      {t("All") || "All"} ({dishes.length})
                    </option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category} (
                        {
                          dishes.filter(
                            (d) => (d.category || "Other") === category,
                          ).length
                        }
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allergen Filter */}
                <div className="bg-white rounded-lg border border-gray-100">
                  <AllergenFilter
                    selectedAllergens={selectedAllergens}
                    onAllergenToggle={(allergen) => {
                      setSelectedAllergens((prev) =>
                        prev.includes(allergen)
                          ? prev.filter((a) => a !== allergen)
                          : [...prev, allergen],
                      );
                    }}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search ingredients, allergens..."
                    isMobile={true}
                  />
                </div>
              </div>

              {/* Drawer Footer - Clean design matching admin */}
              <div className="border-t border-sage-200 p-4 bg-gradient-to-r from-sage-600 to-sage-500">
                <button
                  onClick={scrollToMenu}
                  className="w-full bg-white text-sage-700 py-3 rounded-md font-medium hover:bg-sage-50 transition-all duration-200 flex items-center justify-center min-h-[44px] shadow-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-sm">{t("showSafeDishes")}</span>
                </button>
                {(selectedAllergens.length > 0 ||
                  selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedAllergens([]);
                      setSelectedCategory("all");
                    }}
                    className="w-full mt-3 text-sage-100 py-2 text-sm hover:text-white font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main
        className="flex-1 w-full mx-auto px-3 py-4 lg:max-w-[90vw] xl:max-w-[1200px] pb-8"
        ref={menuSectionRef}
      >
        {/* Welcome Information - Show once per session */}
        {showWelcomeInfo && (
          <div className="mb-6 bg-gradient-to-r from-sage-50 to-green-50 border border-sage-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-sage-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-sage-800 mb-1">
                    Welcome to {restaurant?.name || "our"} Allergen-Safe Menu
                  </h3>
                  <p className="text-xs text-sage-700 leading-relaxed">
                    Select your allergens below to see only dishes that are safe
                    for you. All ingredient information is carefully maintained
                    and regularly updated.
                  </p>
                  <div className="flex items-center mt-2 text-xs text-sage-600">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Always inform your server about severe allergies
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setShowWelcomeInfo(false);
                  localStorage.setItem("welcome-info-seen", "true");
                }}
                className="text-sage-400 hover:text-sage-600 transition-colors p-1"
                aria-label="Close welcome message"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Filters - Elegant and minimal */}
        <div className="hidden lg:block mb-6 space-y-4">
          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {t("Category") || "Category"}
              </h3>
              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs text-sage-600 hover:text-sage-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === "all"
                    ? "bg-sage-100 text-sage-800 border border-sage-300"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                All ({dishes.length})
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedCategory === category
                      ? "bg-sage-100 text-sage-800 border border-sage-300"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {category} (
                  {
                    dishes.filter((d) => (d.category || "Other") === category)
                      .length
                  }
                  )
                </button>
              ))}
            </div>
          </div>

          {/* Allergen Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <AllergenFilter
              selectedAllergens={selectedAllergens}
              onAllergenToggle={(allergen) => {
                setSelectedAllergens((prev) =>
                  prev.includes(allergen)
                    ? prev.filter((a) => a !== allergen)
                    : [...prev, allergen],
                );
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search ingredients, allergens..."
            />
          </div>
        </div>

        {/* Dishes by Safety Level */}
        <div className="space-y-6">
          {selectedAllergens.length === 0 ? (
            /* Show all dishes when no allergens selected */
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mr-2"></span>
                {`${t("allDishes")} (${filteredDishes.length})`}
              </h2>
              <p className="text-gray-600 mb-3 text-sm">
                {t("selectAllergensHelp")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    safetyStatus={{
                      status: "safe",
                      allergens: [],
                    }}
                    showPrices={restaurant?.showPrices !== false}
                    currency={restaurant?.currency || "SEK"}
                    language={currentLanguage as any}
                    hasSelectedAllergens={false}
                    onCardSelect={handleCardSelect}
                    onCardLongPress={handleCardLongPress}
                  />
                ))}
              </div>
            </section>
          ) : (
            /* Show filtered dishes by safety when allergens are selected */
            <>
              {/* Safe Dishes */}
              {categorizedDishes.safe.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                    {t("safeDishesTitle")} ({categorizedDishes.safe.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {categorizedDishes.safe.map(({ dish, safety }) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || "SEK"}
                        hasSelectedAllergens={true}
                        onCardSelect={handleCardSelect}
                        onCardLongPress={handleCardLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Unsafe Dishes - dishes with allergens in base components but still visible */}
              {categorizedDishes.unsafe.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                    Contains Your Allergens ({categorizedDishes.unsafe.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-75">
                    {categorizedDishes.unsafe.map(({ dish, safety }) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || "SEK"}
                        hasSelectedAllergens={true}
                        onCardSelect={handleCardSelect}
                        onCardLongPress={handleCardLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* No Results */}
        {filteredDishes.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No dishes found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try adjusting your search or allergen filters
            </p>
          </div>
        )}
      </main>

      {/* Footer - Trust & Information */}
      <footer className="bg-white border-t border-gray-100 lg:sticky lg:bottom-0 mt-auto">
        <div className="max-w-7xl mx-auto px-3 py-3 lg:py-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 mb-3">
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure & Private
              </div>
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Ingredients
              </div>
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Real-time Updates
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              MenuShield helps you dine safely. Information is provided by{" "}
              {restaurant?.name || "the restaurant"} and updated regularly.
            </p>
            <p className="text-xs text-gray-400">
              For severe allergies, always confirm with restaurant staff. We
              prioritize your safety above all.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

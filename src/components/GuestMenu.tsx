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
import type { Dish } from "../types";

export default function GuestMenu() {
  const { data: dishes = [], isLoading, error } = useMenu();
  const { restaurant } = useRestaurant();
  const { t, currentLanguage } = useMenuTranslations();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Enhanced touch gestures for mobile filter
  const swipeRef = useSwipeNavigation(
    () => setShowMobileFilter(false), // Swipe left to close
    undefined,
    75
  );

  // Close mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileFilter && !(event.target as Element).closest('[data-drawer="mobile-filter"]')) {
        setShowMobileFilter(false);
      }
    };

    if (showMobileFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileFilter]);

  const scrollToMenu = () => {
    setShowMobileFilter(false); // Close mobile filter when showing dishes
    setTimeout(() => {
      if (menuSectionRef.current) {
        const headerHeight = document.querySelector('.mobile-header')?.clientHeight || 80;
        const targetPosition = menuSectionRef.current.offsetTop - headerHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 300); // Wait for drawer close animation
  };

  // Enhanced card interactions for native mobile feel
  const handleCardSelect = (dish: any) => {
    // Could show dish details modal or add to order
    console.log('Card selected:', dish.name);
  };

  const handleCardLongPress = (dish: any) => {
    // Could show context menu or quick actions
    console.log('Card long pressed:', dish.name);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-gray-50">
        {/* Mobile Header */}
        <div className="mobile-header lg:hidden sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white">MenuShield</h1>
                <p className="text-sage-100 text-sm">Ladataan menua...</p>
              </div>
              <div className="w-20 h-8 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <SkeletonLoader type="header" />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {/* Filter Skeleton */}
          <SkeletonLoader type="filter" />
          
          {/* Dish Grid Skeleton */}
          <SkeletonLoader type="dish-grid" count={9} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('errorLoading')}: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // Filter dishes based on search term and modifiable filter
  let filteredDishes = dishes.filter(dish =>
    dish.is_active !== false &&
    (
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Categorize dishes by safety level
  const categorizedDishes = filteredDishes.reduce((acc, dish) => {
    const safety = analyzeDishSafety(dish, selectedAllergens);
    acc[safety.status].push({ dish, safety });
    return acc;
  }, {
    safe: [] as Array<{ dish: Dish; safety: ReturnType<typeof analyzeDishSafety> }>,
    modifiable: [] as Array<{ dish: Dish; safety: ReturnType<typeof analyzeDishSafety> }>,
    unsafe: [] as Array<{ dish: Dish; safety: ReturnType<typeof analyzeDishSafety> }>
  });

  return (
    <div className="min-h-screen bg-warm-gray-50">
      {/* Mobile Header - Refined dining aesthetic */}
      <div className="mobile-header lg:hidden sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">MenuShield</h1>
              <p className="text-sage-100 text-sm">{t('safeDining')}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <LanguageSelector variant="compact" className="z-50" />
              <button
              onClick={() => setShowMobileFilter(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-3 py-2.5 rounded-lg flex items-center gap-2 hover:bg-white/30 transition-all duration-200 active:scale-98 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-8.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium text-sm">{t('filter')}</span>
              {selectedAllergens.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] font-semibold">
                  {selectedAllergens.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Desktop Header - More refined and minimal */}
      <div className="hidden lg:block sticky top-0 z-40 bg-gradient-to-r from-sage-600 to-sage-500 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-white mb-1">MenuShield</h1>
              <p className="text-sage-100 text-sm">{t('safeDining')}</p>
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
            className="lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform translate-x-0 rounded-l-2xl animate-slide-in-right"
            style={{ animationDuration: '0.3s', animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-tl-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('filterMenu')}</h2>
                    <p className="text-green-100 text-sm mt-1">{t('findSafeDishes')}</p>
                  </div>
                  <button
                    onClick={() => setShowMobileFilter(false)}
                    className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <AllergenFilter
                  selectedAllergens={selectedAllergens}
                  onAllergenToggle={(allergen) => {
                    setSelectedAllergens(prev =>
                      prev.includes(allergen)
                        ? prev.filter(a => a !== allergen)
                        : [...prev, allergen]
                    );
                  }}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                    isMobile={true}
                  />
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-br-2xl">
                  <button
                    onClick={scrollToMenu}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg active:scale-95 flex items-center justify-center min-h-[48px]"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {t('showSafeDishes')}
                  </button>                {selectedAllergens.length > 0 && (
                  <button
                    onClick={() => setSelectedAllergens([])}
                    className="w-full mt-3 text-gray-600 py-2 text-sm hover:text-gray-800 font-medium"
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
      <main className="max-w-7xl mx-auto px-4 py-6" ref={menuSectionRef}>
        {/* Desktop Allergen Filter */}
        <div className="hidden lg:block mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <AllergenFilter
              selectedAllergens={selectedAllergens}
              onAllergenToggle={(allergen) => {
                setSelectedAllergens(prev => 
                  prev.includes(allergen)
                    ? prev.filter(a => a !== allergen)
                    : [...prev, allergen]
                );
              }}
            />
          </div>
        </div>

        {/* Dishes by Safety Level */}
        <div className="space-y-8">
          {selectedAllergens.length === 0 ? (
            /* Show all dishes when no allergens selected */
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
                {`${t('allDishes')} (${filteredDishes.length})`}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('selectAllergensHelp')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDishes.map((dish) => (
                  <DishCard 
                    key={dish.id}
                    dish={dish} 
                    safetyStatus={{ 
                      status: "safe", 
                      allergens: [] 
                    }}
                    showPrices={restaurant?.showPrices !== false}
                    currency={restaurant?.currency || 'EUR'}
                    language={currentLanguage as any}
                    onCardSelect={handleCardSelect}
                    onCardLongPress={handleCardLongPress}
                  />
                ))}
              </div>
            </section>
          ) : (
            <>
              {/* Safe Dishes */}
              {categorizedDishes.safe.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                    {t('safeDishesTitle')} ({categorizedDishes.safe.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedDishes.safe.map(({ dish, safety }) => (
                      <DishCard 
                        key={dish.id}
                        dish={dish} 
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || 'EUR'}
                        onCardSelect={handleCardSelect}
                        onCardLongPress={handleCardLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Modifiable and Unsafe Dishes Combined */}
              {(categorizedDishes.modifiable.length > 0 || categorizedDishes.unsafe.length > 0) && (
                <section>
                  <h2 className="text-2xl font-bold text-orange-700 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                    {categorizedDishes.unsafe.length > 0 
                      ? `Contains Required Allergens (${categorizedDishes.unsafe.length})`
                      : `⚠️ May Be Modifiable (${categorizedDishes.modifiable.length})`
                    }
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Show modifiable dishes first */}
                    {categorizedDishes.modifiable.map(({ dish, safety }) => (
                      <DishCard 
                        key={dish.id}
                        dish={dish} 
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || 'EUR'}
                        onCardSelect={handleCardSelect}
                        onCardLongPress={handleCardLongPress}
                      />
                    ))}
                    {/* Then show unsafe dishes */}
                    {categorizedDishes.unsafe.map(({ dish, safety }) => (
                      <DishCard 
                        key={dish.id}
                        dish={dish} 
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || 'EUR'}
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-600">Try adjusting your search or allergen filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
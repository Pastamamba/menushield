import { useState, useEffect, useRef } from "react";
import { useMenu } from "../utils/dishApi";
import { useRestaurant } from "../contexts/RestaurantContext";
import AllergenFilter from "../components/AllergenFilter";
import DishCard from "./DishCard";
import { analyzeDishSafety } from "../utils/dishAnalyzer";
import type { Dish } from "../types";

export default function GuestMenu() {
  const { data: dishes = [], isLoading, error } = useMenu();
  const { restaurant, restaurantSlug, isLoading: restaurantLoading } = useRestaurant();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const menuSectionRef = useRef<HTMLDivElement>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading menu: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter dishes based on search term
  const filteredDishes = dishes.filter(dish =>
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Always visible on mobile */}
      <div className="mobile-header lg:hidden sticky top-0 z-40 bg-gradient-to-r from-green-500 to-blue-600 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">MenuShield</h1>
              <p className="text-green-100 text-sm">Turvallinen ruokailu kaikille</p>
            </div>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/30 transition-all active:scale-95 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-8.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Suodata</span>
              {selectedAllergens.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] font-semibold">
                  {selectedAllergens.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header - Always visible on desktop */}
      <div className="hidden lg:block sticky top-0 z-40 bg-gradient-to-r from-green-500 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">MenuShield</h1>
            <p className="text-green-100">Safe dining for everyone</p>
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
            data-drawer="mobile-filter"
            className="lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform translate-x-0 rounded-l-2xl animate-slide-in-right"
            style={{ animationDuration: '0.3s', animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-tl-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Suodata menu</h2>
                    <p className="text-green-100 text-sm mt-1">Löydä turvallisia ruokia itsellesi</p>
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
                    Näytä turvalliset ruokani
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
                All dishes ({filteredDishes.length})
              </h2>
              <p className="text-gray-600 mb-4">
                Select allergens to see safe options
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
                    Safe dishes ({categorizedDishes.safe.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedDishes.safe.map(({ dish, safety }) => (
                      <DishCard 
                        key={dish.id} 
                        dish={dish} 
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || 'EUR'}
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
                    Contains allergens ({categorizedDishes.modifiable.length + categorizedDishes.unsafe.length})
                  </h2>
                  <p className="text-orange-600 mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    ⚠️ These dishes contain your selected allergens. Ask the server if allergens can be modified or removed.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Show modifiable dishes first */}
                    {categorizedDishes.modifiable.map(({ dish, safety }) => (
                      <DishCard 
                        key={dish.id} 
                        dish={dish} 
                        safetyStatus={safety}
                        showPrices={restaurant?.showPrices !== false}
                        currency={restaurant?.currency || 'EUR'}
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
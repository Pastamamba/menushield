import { useState } from "react";
import AllergenFilter from "../components/AllergenFilter";
import DishCard from "./DishCard";
import { MenuLoadingState } from "./LoadingShimmer";
import { useMenu } from "../utils/dishApi";
import { analyzeDishSafety } from "../utils/dishAnalyzer";
import type { Dish, DishSafetyStatus } from "../types";

interface DishAnalysis {
  dish: Dish;
  safety: DishSafetyStatus;
}

export default function GuestMenu() {
  // Use TanStack Query for menu data
  const { data: menu = [], isLoading, error: queryError } = useMenu();
  const [avoid, setAvoid] = useState<string[]>([]);

  // Analyze dishes with new component-based system
  const dishAnalysis: DishAnalysis[] = menu.map((dish: Dish) => ({
    dish,
    safety: analyzeDishSafety(dish, avoid),
  }));

  const safeDishes = dishAnalysis.filter(
    ({ safety }: DishAnalysis) => safety.status === "safe"
  );
  const modifiableDishes = dishAnalysis.filter(
    ({ safety }: DishAnalysis) => safety.status === "modifiable"
  );
  const unsafeDishes = dishAnalysis.filter(
    ({ safety }: DishAnalysis) => safety.status === "unsafe"
  );
  if (isLoading) {
    return <MenuLoadingState />;
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Menu Unavailable
          </h2>
          <p className="text-gray-600 mb-4">{queryError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Enhanced Allergen Filter */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              MenuShield
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                🛡️ Allergy-Safe Menu
              </span>
            </div>
          </div>
          
          {/* Enhanced Allergen Selection - Always Visible */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
              🔍 Select Allergens to Avoid
            </h2>
            <AllergenFilter avoid={avoid} setAvoid={setAvoid} />
            
            {/* Show Dishes Button */}
            {avoid.length > 0 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    const menuSection = document.getElementById('menu-results');
                    menuSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold text-lg shadow-lg"
                >
                  🍽️ Show My Safe Dishes ({safeDishes.length + modifiableDishes.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl" id="menu-results">
        {/* Results Summary */}
        {avoid.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Avoiding:{" "}
                {avoid
                  .map(
                    (allergen: string) =>
                      allergen.charAt(0).toUpperCase() + allergen.slice(1)
                  )
                  .join(", ")}
              </div>
              <button
                onClick={() => setAvoid([])}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                Clear All
              </button>
            </div>{" "}
            <div className="mt-2 text-sm font-medium text-gray-800">
              Found {safeDishes.length} safe dishes, {modifiableDishes.length}{" "}
              modifiable dishes, and {unsafeDishes.length} unsafe dishes
            </div>
          </section>
        )}{" "}
        {/* Safe Dishes */}
        {safeDishes.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-green-700 flex items-center gap-2">
              ✅ Safe Dishes ({safeDishes.length})
            </h3>
            <div className="grid gap-4">
              {safeDishes.map(({ dish, safety }: DishAnalysis) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  safetyStatus={safety}
                  isOffline={false}
                />
              ))}
            </div>
          </section>
        )}
        {/* Modifiable Dishes */}
        {modifiableDishes.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-yellow-700 flex items-center gap-2">
              ⚠️ Dishes You May Be Able To Customize ({modifiableDishes.length})
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                💡{" "}
                <strong>
                  These dishes contain allergens in optional components
                </strong>{" "}
                (like sauce, side, or garnish) that may be removable or
                swappable. Ask your server for modifications!
              </p>
            </div>{" "}
            <div className="grid gap-4">
              {modifiableDishes.map(({ dish, safety }: DishAnalysis) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  safetyStatus={safety}
                  isOffline={false}
                />
              ))}
            </div>
          </section>
        )}
        {/* Unsafe Dishes */}
        {unsafeDishes.length > 0 && avoid.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-red-700 flex items-center gap-2">
              ❌ Dishes That Cannot Be Made Safe ({unsafeDishes.length})
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                ⚠️{" "}
                <strong>
                  These dishes contain allergens in their base components
                </strong>{" "}
                and cannot be safely modified. Please avoid these dishes.
              </p>
            </div>
            <div className="grid gap-4">
              {unsafeDishes.map(({ dish, safety }: DishAnalysis) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  safetyStatus={safety}
                  isOffline={false}
                />
              ))}
            </div>
          </section>
        )}
        {/* Enhanced No matches with better messaging */}
        {avoid.length > 0 &&
          safeDishes.length === 0 &&
          modifiableDishes.length === 0 && (
            <section className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-6xl mb-4">😕</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Safe or Modifiable Options Found
              </h3>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
                We couldn't find any dishes that are safe or easily modifiable
                for your selected allergens ({avoid.join(", ")}).
              </p>
              {unsafeDishes.length > 0 && (
                <p className="text-red-600 mb-6 max-w-md mx-auto text-sm">
                  All available dishes contain allergens in their base
                  components and cannot be safely modified.
                </p>
              )}

              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🔍</div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    Try Fewer Filters
                  </h4>
                  <p className="text-sm text-blue-600">
                    Remove some allergens to see more options
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🍽️</div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Ask Your Server
                  </h4>
                  <p className="text-sm text-yellow-600">
                    They may have special accommodations or off-menu options
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📞</div>
                  <h4 className="font-medium text-green-800 mb-1">
                    Call Ahead
                  </h4>
                  <p className="text-sm text-green-600">
                    Restaurants often create custom allergen-free dishes
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setAvoid([])}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </section>
          )}
        {/* No filters selected */}
        {avoid.length === 0 && (
          <section className="text-center py-8 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">👆</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Select Your Allergens Above
            </h3>
            <p className="text-gray-600">
              Choose any allergens you need to avoid to see your personalized
              safe menu.
            </p>
          </section>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <span className="text-green-600 font-semibold">MenuShield</span> -
            Keeping dining safe for everyone
          </p>
        </div>
      </footer>
    </div>
  );
}

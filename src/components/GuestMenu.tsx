import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import AllergenFilter from "../components/AllergenFilter";
import OfflineNotification, { OnlineNotification } from "./OfflineNotification";
import { offlineManager } from "../utils/offlineManager";
import type { Dish } from "../types";
import { MenuLoadingState } from "./LoadingShimmer";

interface RestaurantInfo {
  name: string;
  description?: string;
  contact?: string;
}

export default function GuestMenu() {
  const [searchParams] = useSearchParams();
  const { restaurantId: urlRestaurantId } = useParams();
  const restaurantId =
    urlRestaurantId || searchParams.get("rid") || searchParams.get("r");

  const [menu, setMenu] = useState<Dish[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<
    "online" | "offline" | "slow"
  >("online");

  useEffect(() => {
    // Setup offline listener
    const unsubscribe = offlineManager.addListener((online) => {
      const wasOffline = isOffline;
      setIsOffline(!online);

      if (online && wasOffline) {
        // Just came back online
        setJustCameOnline(true);
        fetchMenuData();
      }
    });

    fetchMenuData();

    return () => {
      unsubscribe();
    };
  }, [restaurantId]);

  // Clear the "just came online" state after showing notification
  useEffect(() => {
    if (justCameOnline) {
      const timer = setTimeout(() => {
        setJustCameOnline(false);
      }, 3500); // Slightly longer than notification display time
      return () => clearTimeout(timer);
    }
  }, [justCameOnline]);

  // Monitor network status and quality
  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        return;
      }

      // Check connection quality if available
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === "slow-2g" || effectiveType === "2g") {
          setNetworkStatus("slow");
        } else {
          setNetworkStatus("online");
        }
      } else {
        setNetworkStatus("online");
      }
    };

    updateNetworkStatus();

    const handleConnectionChange = () => updateNetworkStatus();
    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    // Listen for connection type changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    return () => {
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch restaurant info and menu
      const [menuRes, restaurantRes] = await Promise.all([
        fetch(`/api/menu${restaurantId ? `?rid=${restaurantId}` : ""}`),
        fetch(`/api/restaurant${restaurantId ? `?rid=${restaurantId}` : ""}`),
      ]);

      if (!menuRes.ok) {
        throw new Error("Failed to load menu");
      }

      const menuData = await menuRes.json();
      setMenu(menuData);

      // Check if data came from cache
      const servedFrom = menuRes.headers.get("X-Served-From");
      setIsFromCache(servedFrom === "cache" || servedFrom === "fallback");

      // Restaurant info is optional
      if (restaurantRes.ok) {
        const restaurantData = await restaurantRes.json();
        setRestaurant(restaurantData);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      if (offlineManager.isOffline()) {
        setError("You're offline. Showing cached menu if available.");
      } else {
        setError("Failed to load menu. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const safeDishes = menu.filter(
    (d) => !d.allergen_tags.some((tag) => avoid.includes(tag))
  );

  const modifiableDishes = menu.filter(
    (d) =>
      d.allergen_tags.some((tag) => avoid.includes(tag)) &&
      d.is_modifiable &&
      Boolean(d.modification_note)
  );
  if (loading) {
    return <MenuLoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Menu Unavailable
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
      {/* Offline/Online Notifications */}
      <OfflineNotification show={isOffline} onRefresh={() => fetchMenuData()} />
      <OnlineNotification show={justCameOnline} />

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              {restaurant?.name || "MenuShield"}
            </h1>
            {restaurant?.description && (
              <p className="text-gray-600 mb-2">{restaurant.description}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                🛡️ Allergy-Safe Menu
              </span>
              {networkStatus === "offline" && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  📵 Offline
                </span>
              )}
              {networkStatus === "slow" && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  🐌 Slow Connection
                </span>
              )}
              {isFromCache && networkStatus === "online" && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  💾 Cached
                </span>
              )}
              {restaurant?.contact && <span>• {restaurant.contact}</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl">
        {/* Instructions */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🔍 How to Use This Menu
          </h2>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Select any allergens you need to avoid below</li>
            <li>• We'll show you dishes that are completely safe</li>
            <li>• We'll also show dishes that can be modified to be safe</li>
            <li>• Your ingredient information stays private and secure</li>
          </ul>
        </section>
        {/* Allergen Selection */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Select Allergens to Avoid
          </h2>
          <AllergenFilter avoid={avoid} setAvoid={setAvoid} />
        </section>
        {/* Results Summary */}
        {avoid.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Avoiding:{" "}
                {avoid
                  .map(
                    (allergen) =>
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
            </div>
            <div className="mt-2 text-sm font-medium text-gray-800">
              Found {safeDishes.length} safe dishes and{" "}
              {modifiableDishes.length} modifiable dishes
            </div>
          </section>
        )}{" "}
        {/* Safe Dishes */}
        {safeDishes.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-green-700 flex items-center gap-2">
              ✅ Safe Dishes ({safeDishes.length})
              {isOffline && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  📱 Offline
                </span>
              )}
            </h3>
            <div className={`grid gap-4 ${isOffline ? "offline-mode" : ""}`}>
              {safeDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4 hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {dish.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      {dish.is_modifiable && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          🔧 Customizable
                        </span>
                      )}
                      {dish.price && (
                        <span className="text-green-600 font-semibold">
                          ${dish.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {dish.description && (
                    <p className="text-gray-600 mb-2">{dish.description}</p>
                  )}

                  {dish.is_modifiable && dish.modification_note && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">💡 Tip:</span>{" "}
                        {dish.modification_note}
                      </p>
                    </div>
                  )}

                  {dish.category && (
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {dish.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}{" "}
        {/* Modifiable Dishes with enhanced visual indicators */}
        {modifiableDishes.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-yellow-700 flex items-center gap-2">
              ⚠️ Dishes You Can Modify ({modifiableDishes.length})
              {isOffline && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  📱 Offline
                </span>
              )}
            </h3>
            <div className={`grid gap-4 ${isOffline ? "offline-mode" : ""}`}>
              {modifiableDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-4 hover:shadow-md transition-shadow relative"
                >
                  {/* Modification indicator badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      🔧 MODIFIABLE
                    </span>
                  </div>

                  <div className="flex justify-between items-start mb-2 pr-24">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {dish.name}
                    </h4>
                    {dish.price && (
                      <span className="text-green-600 font-semibold">
                        ${dish.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {dish.description && (
                    <p className="text-gray-600 mb-3">{dish.description}</p>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                        <span className="text-yellow-800 text-xs">💡</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          How to make this dish safe for you:
                        </p>
                        <p className="text-sm text-yellow-700">
                          {dish.modification_note}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {dish.category && (
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {dish.category}
                      </span>
                    )}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>👨‍🍳</span>
                      <span>Ask your server about this modification</span>
                    </div>
                  </div>
                </div>
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
                No Safe Options Found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any dishes that avoid all your selected
                allergens ({avoid.join(", ")}). Here are some suggestions:
              </p>

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
                    They may have special accommodations
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📞</div>
                  <h4 className="font-medium text-green-800 mb-1">
                    Call Ahead
                  </h4>
                  <p className="text-sm text-green-600">
                    Restaurants often create custom dishes
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
                {restaurant?.contact && (
                  <button
                    onClick={() =>
                      window.open(`tel:${restaurant.contact}`, "_self")
                    }
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Call Restaurant
                  </button>
                )}
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
            <span className="text-green-600 font-semibold">MenuShield</span>-
            Keeping dining safe for everyone
          </p>
          {restaurant?.contact && (
            <p className="mt-1">Questions? Contact us: {restaurant.contact}</p>
          )}
        </div>
      </footer>
    </div>
  );
}

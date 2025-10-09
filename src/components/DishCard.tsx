import type { Dish, DishSafetyStatus } from "../types";
import { getAllergenChips } from "../utils/allergenCalculator";
import { formatPrice } from "../utils/currency";
import { useCardGestures } from "../hooks/useEnhancedTouchGestures";

interface DishCardProps {
  dish: Dish;
  safetyStatus: DishSafetyStatus;
  isOffline?: boolean;
  showPrices?: boolean;
  currency?: string;
  onCardSelect?: (dish: Dish) => void;
  onCardLongPress?: (dish: Dish) => void;
}

export default function DishCard({
  dish,
  safetyStatus,
  isOffline,
  showPrices = true,
  currency = 'EUR',
  onCardSelect,
  onCardLongPress,
}: DishCardProps) {
  const getStatusIcon = () => {
    switch (safetyStatus.status) {
      case "safe":
        return "✅";
      case "modifiable":
        return "⚠️";
      case "unsafe":
        return "❌";
    }
  };

  // Get only the allergens that the user is avoiding and are present in this dish
  const getUserAvoidedAllergens = () => {
    // safetyStatus.allergens contains only the allergens the user is avoiding that are in this dish
    if (!safetyStatus.allergens || safetyStatus.allergens.length === 0) {
      return [];
    }

    // Extract allergen tags and get their info
    const allergenTags = safetyStatus.allergens.map(allergen => allergen.tag);
    const allergenChips = getAllergenChips(allergenTags);
    
    return allergenChips.map(allergen => {
      // Find which component contains this allergen
      const allergenInfo = safetyStatus.allergens.find(a => a.tag === allergen.name);
      
      return {
        ...allergen,
        component: allergenInfo?.component || '',
        canModify: allergenInfo?.canModify || false
      };
    });
  };

  // Mobile haptic feedback helper
  const handleTouchFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Enhanced touch gestures for native mobile feel
  const cardGestures = useCardGestures(
    () => {
      onCardSelect?.(dish);
    },
    () => {
      onCardLongPress?.(dish);
    },
    true // Enable haptic feedback
  );

  const userAvoidedAllergens = getUserAvoidedAllergens();

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 active:scale-[0.98] transition-transform"
      {...cardGestures}
    >
      {/* Traditional Menu Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{dish.name}</h3>
            <span className="text-lg">{getStatusIcon()}</span>
          </div>
          
          {/* Price */}
          {showPrices && dish.price && (
            <div className="text-base font-medium text-gray-700 mt-1">
              {formatPrice(dish.price, currency)}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {dish.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {dish.description}
        </p>
      )}

      {/* Allergens with Components - Only User's Avoided Allergens */}
      {userAvoidedAllergens.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-xs font-medium text-gray-500 mb-2">
            ⚠️ Contains Your Allergens:
          </div>
          <div className="space-y-2">
            {userAvoidedAllergens.map((allergen) => (
              <div key={allergen.name} className="flex items-center gap-2 text-sm">
                <span 
                  className={`inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-95 ${allergen.color}`}
                  onTouchStart={handleTouchFeedback}
                >
                  <span className="capitalize">{allergen.name}</span>
                </span>
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-2 min-h-[40px] rounded-lg flex items-center">
                  in {allergen.component || 'Base'}
                  {allergen.canModify && (
                    <span className="text-green-600 ml-1 font-medium">(poistettavissa)</span>
                  )}
                  {!allergen.canModify && allergen.component && (
                    <span className="text-red-600 ml-1 font-medium">(pakollinen)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          
          {/* Action suggestion */}
          {safetyStatus.status === "modifiable" && safetyStatus.modificationSuggestion && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-700 font-medium">
                💡 {safetyStatus.modificationSuggestion}
              </div>
            </div>
          )}
          {safetyStatus.status === "unsafe" && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700 font-medium">
                ⚠️ Sisältää allergeeneja pakollisissa osissa - ei voida turvallisesti muokata
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safe status message */}
      {safetyStatus.status === "safe" && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-base text-green-600 font-medium py-2">
            ✅ Turvallinen allergeeneillesi
          </div>
        </div>
      )}

      {/* Category tag - minimal */}
      {dish.category && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {dish.category}
          </span>
        </div>
      )}

      {/* Offline indicator */}
      {isOffline && (
        <div className="absolute top-3 right-3">
          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
            📱
          </span>
        </div>
      )}
    </div>
  );
}

import type { Dish, DishSafetyStatus } from "../types";
import { getAllergenChips } from "../utils/allergenCalculator";
import { formatPrice } from "../utils/currency";
import { useCardGestures } from "../hooks/useEnhancedTouchGestures";
import type { AllergenLanguage } from "../utils/allergenTranslations";

interface DishCardProps {
  dish: Dish;
  safetyStatus: DishSafetyStatus;
  isOffline?: boolean;
  showPrices?: boolean;
  currency?: string;
  language?: AllergenLanguage;
  hasSelectedAllergens?: boolean;
  onCardSelect?: (dish: Dish) => void;
  onCardLongPress?: (dish: Dish) => void;
}

export default function DishCard({
  dish,
  safetyStatus,
  isOffline,
  showPrices = true,
  currency = "SEK",
  language = "en",
  hasSelectedAllergens = false,
  onCardSelect,
  onCardLongPress,
}: DishCardProps) {
  const getStatusIcon = () => {
    return ""; // No icons, using color-coded borders instead
  };

  // Get only the allergens that the user is avoiding and are present in this dish
  const getUserAvoidedAllergens = () => {
    // safetyStatus.allergens contains only the allergens the user is avoiding that are in this dish
    if (!safetyStatus.allergens || safetyStatus.allergens.length === 0) {
      return [];
    }

    // Extract allergen tags and get their info
    const allergenTags = safetyStatus.allergens.map((allergen) => allergen.tag);
    const allergenChips = getAllergenChips(allergenTags, language);

    return allergenChips.map((allergen) => {
      // Find which component contains this allergen
      const allergenInfo = safetyStatus.allergens.find(
        (a) => a.tag === allergen.name
      );

      return {
        ...allergen,
        component: allergenInfo?.component || "",
        canModify: allergenInfo?.canModify || false,
      };
    });
  };

  // Mobile haptic feedback helper
  const handleTouchFeedback = () => {
    if ("vibrate" in navigator) {
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

  const getCardStyling = () => {
    // Only show colors when allergens are selected
    if (!hasSelectedAllergens) {
      return "border-gray-100";
    }
    
    if (safetyStatus.status === "safe") {
      return "border-green-200 bg-green-50/30";
    } else if (safetyStatus.status === "modifiable") {
      return "border-orange-200 bg-orange-50/30";
    } else if (safetyStatus.status === "unsafe") {
      return "border-red-200 bg-red-50/30";
    }
    return "border-gray-100";
  };

  return (
    <div
      className={`bg-white border rounded-lg p-3 transition-all duration-200 hover:shadow-sm hover:border-gray-200 relative cursor-pointer ${getCardStyling()}`}
      {...cardGestures}
    >
      {/* Header with name, status, and price in one line */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs">{getStatusIcon()}</span>
          <h3 className="text-xs font-medium text-gray-900 truncate">
            {dish.name}
          </h3>
        </div>
        {showPrices && dish.price && dish.price > 0 && (
          <span className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">
            {formatPrice(dish.price, currency)}
          </span>
        )}
      </div>

      {/* Description - Very compact with consistent spacing */}
      <div className="mb-2 min-h-[2rem] flex items-start">
        {dish.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
            {dish.description}
          </p>
        )}
      </div>

      {/* Allergens - Compact inline display */}
      {userAvoidedAllergens.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {userAvoidedAllergens.map((allergen) => (
              <span
                key={allergen.name}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${allergen.color}`}
                onTouchStart={handleTouchFeedback}
              >
                {allergen.displayName}
              </span>
            ))}
          </div>

          {/* Status message - compact */}
          {safetyStatus.status === "modifiable" && (
            <div className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
              May be modifiable - ask server
            </div>
          )}
        </div>
      )}

      {/* Category tag - inline at bottom - only show if there's content */}
      {dish.category && (
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-50">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {dish.category}
          </span>
        </div>
      )}

      {/* Offline indicator - minimal */}
      {isOffline && (
        <div className="absolute top-1.5 right-1.5">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
        </div>
      )}
    </div>
  );
}

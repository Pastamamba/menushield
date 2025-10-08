import type { Dish, DishSafetyStatus } from "../types";
import { getAllergenChips } from "../utils/allergenCalculator";
import { formatPrice } from "../utils/currency";

interface DishCardProps {
  dish: Dish;
  safetyStatus: DishSafetyStatus;
  isOffline?: boolean;
  showPrices?: boolean;
  currency?: string;
}

export default function DishCard({
  dish,
  safetyStatus,
  isOffline,
  showPrices = true,
  currency = 'EUR',
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

  const userAvoidedAllergens = getUserAvoidedAllergens();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
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
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${allergen.color}`}>
                  <span>{allergen.icon}</span>
                  <span className="capitalize">{allergen.name}</span>
                </span>
                {allergen.component && (
                  <span className="text-xs text-gray-500">
                    from: {allergen.component}
                    {allergen.canModify && (
                      <span className="text-green-600 ml-1">(removable)</span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Action suggestion */}
          {safetyStatus.status === "modifiable" && (
            <div className="mt-2 text-xs text-orange-600 font-medium">
              💡 Ask your server about removing allergen ingredients
            </div>
          )}
          {safetyStatus.status === "unsafe" && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⚠️ Not recommended - contains multiple allergens
            </div>
          )}
        </div>
      )}

      {/* Safe status message */}
      {safetyStatus.status === "safe" && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-sm text-green-600 font-medium">
            ✅ Safe for your allergies
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

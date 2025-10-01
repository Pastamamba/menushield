import type { Dish, DishSafetyStatus } from "../types";
import { getAllergenChips } from "../utils/allergenCalculator";

interface DishCardProps {
  dish: Dish;
  safetyStatus: DishSafetyStatus;
  isOffline?: boolean;
}

export default function DishCard({
  dish,
  safetyStatus,
  isOffline,
}: DishCardProps) {
  const getStatusConfig = () => {
    switch (safetyStatus.status) {
      case "safe":
        return {
          badge: "✅",
          label: "Safe",
          borderColor: "border-green-500",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
        };
      case "modifiable":
        return {
          badge: "⚠️",
          label: "Contains allergens",
          borderColor: "border-orange-500",
          bgColor: "bg-orange-50",
          textColor: "text-orange-800",
        };
      case "unsafe":
        return {
          badge: "❌",
          label: "Contains allergens",
          borderColor: "border-red-500",
          bgColor: "bg-red-50",
          textColor: "text-red-800",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 ${
        statusConfig.borderColor
      } p-4 hover:shadow-md transition-shadow relative ${
        isOffline ? "offline-mode" : ""
      }`}
    >
      {/* Header with Name, Price, and Status Badge */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-semibold text-gray-800 flex-1">
          {dish.name}
        </h4>
        <div className="flex items-center gap-2 ml-4">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
          >
            <span>{statusConfig.badge}</span>
            <span>{statusConfig.label}</span>
          </span>
          {dish.price && (
            <span className="text-green-600 font-semibold">
              ${dish.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {dish.description && (
        <p className="text-gray-600 mb-3">{dish.description}</p>
      )}

      {/* Allergen Information for Modifiable and Unsafe Dishes */}
      {(safetyStatus.status === "modifiable" || safetyStatus.status === "unsafe") && (
          <div className={`border rounded-lg p-3 mb-3 ${
            safetyStatus.status === "modifiable" 
              ? "bg-orange-50 border-orange-200" 
              : "bg-red-50 border-red-200"
          }`}>
            {/* Show specific allergens found */}
            {safetyStatus.allergens.length > 0 && (
              <div className="mb-2">
                <p className={`text-sm font-medium mb-2 ${
                  safetyStatus.status === "modifiable" ? "text-orange-700" : "text-red-700"
                }`}>
                  Contains allergens:
                </p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(safetyStatus.allergens.map(a => a.tag))).map((allergenName) => {
                    const allergenChip = getAllergenChips([allergenName])[0];
                    return (
                      <span 
                        key={allergenName} 
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergenChip?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                      >
                        <span>{allergenChip?.icon || '⚠️'}</span>
                        <span className="capitalize">{allergenName}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Show all dish allergens as chips */}
            {Array.isArray(dish.allergen_tags) && dish.allergen_tags.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-2 text-gray-700">All allergens in dish:</p>
                <div className="flex flex-wrap gap-1">
                  {getAllergenChips(dish.allergen_tags).map((allergen) => (
                    <span
                      key={allergen.name}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                    >
                      <span>{allergen.icon}</span>
                      <span className="capitalize">{allergen.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {safetyStatus.modificationSuggestion && (
              <p className={`text-sm italic mb-1 ${
                safetyStatus.status === "modifiable" ? "text-orange-700" : "text-red-700"
              }`}>
                {safetyStatus.modificationSuggestion}
              </p>
            )}
            <p className={`text-xs font-medium ${
              safetyStatus.status === "modifiable" ? "text-orange-600" : "text-red-600"
            }`}>
              {safetyStatus.status === "modifiable" 
                ? "💡 Ask the server if allergens can be modified or removed"
                : "⚠️ Not recommended - contains allergens you want to avoid"
              }
            </p>
          </div>
        )}

      {/* Category */}
      <div className="flex items-center justify-between">
        {dish.category && (
          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
            {dish.category}
          </span>
        )}

        {/* Offline indicator */}
        {isOffline && (
          <span className="text-xs text-yellow-600 flex items-center gap-1">
            <span>📱</span>
            <span>Offline</span>
          </span>
        )}
      </div>
    </div>
  );
}

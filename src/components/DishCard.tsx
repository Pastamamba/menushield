import type { Dish, DishSafetyStatus } from "../types";

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
          label: "Sisältää allergeneja",
          borderColor: "border-orange-500",
          bgColor: "bg-orange-50",
          textColor: "text-orange-800",
        };
      case "unsafe":
        return {
          badge: "❌",
          label: "Contains Allergens",
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

      {/* Modification Instruction for Modifiable Dishes */}
      {safetyStatus.status === "modifiable" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            {/* Show specific allergens found */}
            {safetyStatus.allergens.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium text-orange-700 mb-1">
                  Sisältää allergeneja:
                </p>
                <div className="flex flex-wrap gap-1">
                  {safetyStatus.allergens.map((allergen, index) => (
                    <span key={index} className="inline-block bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                      {allergen.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {safetyStatus.modificationSuggestion && (
              <p className="text-sm italic text-orange-700 mb-1">
                {safetyStatus.modificationSuggestion}
              </p>
            )}
            <p className="text-xs text-orange-600 font-medium">
              💡 Kysy tiskiltä, voiko allergeenit vaihtaa tai poistaa
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

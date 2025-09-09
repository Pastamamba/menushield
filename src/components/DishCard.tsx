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
          label: "May Be Customizable",
          borderColor: "border-yellow-500",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
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
      {safetyStatus.status === "modifiable" &&
        safetyStatus.modificationSuggestion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm italic text-yellow-700">
              {safetyStatus.modificationSuggestion}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              💡 Please ask your server about this modification
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

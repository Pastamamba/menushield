import { useState } from "react";

export default function DishManager() {
  const [dishes] = useState([]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Dish Manager</h2>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Items</h3>
        <p className="text-gray-600">
          {dishes.length === 0 ? "No dishes found" : `${dishes.length} dishes`}
        </p>
      </div>
    </div>
  );
}

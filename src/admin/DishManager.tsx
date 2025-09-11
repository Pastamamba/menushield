import { useState } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAuth } from "../auth/AuthContext";
import type { Dish, CreateDishRequest } from "../types";

export default function DishManager() {
  const { token } = useAuth();
  const { data: dishes = [], isLoading, error } = useAdminDishes();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Dish Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Loading dishes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Dish Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-red-600">Error loading dishes: {error.message}</p>
        </div>
      </div>
    );
  }

  // Group dishes by category
  const dishesByCategory = dishes.reduce((acc, dish) => {
    const category = dish.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  const handleCreateDish = async (dishData: CreateDishRequest) => {
    try {
      await createDishMutation.mutateAsync(dishData);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create dish:", error);
    }
  };

  const handleUpdateDish = async (id: string, dishData: Partial<CreateDishRequest>) => {
    try {
      await updateDishMutation.mutateAsync({ id, dish: dishData });
      setEditingDish(null);
    } catch (error) {
      console.error("Failed to update dish:", error);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteDishMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete dish:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Dish Manager</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Add New Dish
        </button>
      </div>

      {Object.entries(dishesByCategory).map(([category, categoryDishes]) => (
        <div key={category} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{category}</h3>
            <p className="text-sm text-gray-500">{categoryDishes.length} items</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categoryDishes.map((dish) => (
              <div key={dish.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{dish.name}</h4>
                  <p className="text-sm text-gray-500">{dish.description}</p>
                  <div className="mt-1">
                    <span className="text-xs text-gray-400">
                      Allergens: {dish.allergen_tags?.length ? dish.allergen_tags.join(", ") : "None"}
                    </span>
                  </div>
                  {dish.price && (
                    <span className="text-sm font-semibold text-green-600">${dish.price}</span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingDish(dish)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {dishes.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No dishes found. Add your first dish to get started!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Add First Dish
          </button>
        </div>
      )}

      {showCreateForm && (
        <CreateDishForm
          onSubmit={handleCreateDish}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingDish && (
        <EditDishForm
          dish={editingDish}
          onSubmit={(data) => handleUpdateDish(editingDish.id, data)}
          onCancel={() => setEditingDish(null)}
        />
      )}
    </div>
  );
}

// Placeholder forms - these would need to be implemented
function CreateDishForm({ onSubmit, onCancel }: { onSubmit: (data: CreateDishRequest) => void; onCancel: () => void }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Add New Dish</h3>
      <p className="text-gray-600 mb-4">Create dish form would go here...</p>
      <div className="flex space-x-2">
        <button onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditDishForm({ dish, onSubmit, onCancel }: { dish: Dish; onSubmit: (data: Partial<CreateDishRequest>) => void; onCancel: () => void }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Edit Dish: {dish.name}</h3>
      <p className="text-gray-600 mb-4">Edit dish form would go here...</p>
      <div className="flex space-x-2">
        <button onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

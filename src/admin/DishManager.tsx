import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Dish, CreateDishRequest, AllergenTag } from "../types";

// Common allergen tags with colors
const COMMON_ALLERGENS: AllergenTag[] = [
  { id: "dairy", name: "Dairy", color: "#3B82F6", icon: "🥛" },
  { id: "gluten", name: "Gluten", color: "#F59E0B", icon: "🌾" },
  { id: "nuts", name: "Nuts", color: "#8B5CF6", icon: "🥜" },
  { id: "peanuts", name: "Peanuts", color: "#EF4444", icon: "🥜" },
  { id: "shellfish", name: "Shellfish", color: "#06B6D4", icon: "🦐" },
  { id: "fish", name: "Fish", color: "#10B981", icon: "🐟" },
  { id: "eggs", name: "Eggs", color: "#F97316", icon: "🥚" },
  { id: "soy", name: "Soy", color: "#84CC16", icon: "🫘" },
  { id: "sesame", name: "Sesame", color: "#A855F7", icon: "🌰" },
];

const CATEGORIES = [
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Sides",
];

export default function DishManager() {
  const { token } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateDishRequest>({
    name: "",
    description: "",
    price: 0,
    category: "",
    ingredients: [],
    allergen_tags: [],
    modification_note: "",
    is_modifiable: false,
  });
  const [currentIngredient, setCurrentIngredient] = useState("");

  const fetchDishes = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/admin/menu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDishes(data);
    } catch (error) {
      console.error("Failed to fetch dishes:", error);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [token]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      ingredients: [],
      allergen_tags: [],
      modification_note: "",
      is_modifiable: false,
    });
    setCurrentIngredient("");
    setEditingDish(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingDish
        ? `http://localhost:4000/api/admin/menu/${editingDish.id}`
        : "http://localhost:4000/api/admin/menu";

      const method = editingDish ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchDishes();
        resetForm();
      } else {
        alert("Failed to save dish");
      }
    } catch (error) {
      console.error("Failed to save dish:", error);
      alert("Failed to save dish");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || "",
      price: dish.price || 0,
      category: dish.category || "",
      ingredients: [...dish.ingredients],
      allergen_tags: [...dish.allergen_tags],
      modification_note: dish.modification_note || "",
      is_modifiable: dish.is_modifiable,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/admin/menu/${dishId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        await fetchDishes();
      } else {
        alert("Failed to delete dish");
      }
    } catch (error) {
      console.error("Failed to delete dish:", error);
      alert("Failed to delete dish");
    }
  };

  const addIngredient = () => {
    if (
      currentIngredient.trim() &&
      !formData.ingredients.includes(currentIngredient.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, currentIngredient.trim()],
      }));
      setCurrentIngredient("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i !== ingredient),
    }));
  };

  const toggleAllergen = (allergenId: string) => {
    setFormData((prev) => ({
      ...prev,
      allergen_tags: prev.allergen_tags.includes(allergenId)
        ? prev.allergen_tags.filter((id) => id !== allergenId)
        : [...prev.allergen_tags, allergenId],
    }));
  };

  const getAllergenById = (id: string) =>
    COMMON_ALLERGENS.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dish Management</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add New Dish
        </button>
      </div>

      {/* Dish List */}
      <div className="grid gap-4">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{dish.name}</h3>
                  {dish.category && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {dish.category}
                    </span>
                  )}
                  {dish.price && (
                    <span className="text-green-600 font-medium">
                      ${dish.price}
                    </span>
                  )}
                </div>

                {dish.description && (
                  <p className="text-gray-600 mb-2">{dish.description}</p>
                )}

                {dish.ingredients.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Ingredients:{" "}
                    </span>
                    <span className="text-sm text-gray-600">
                      {dish.ingredients.join(", ")}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
                  {dish.allergen_tags.map((tagId) => {
                    const allergen = getAllergenById(tagId);
                    return allergen ? (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: allergen.color }}
                      >
                        {allergen.icon} {allergen.name}
                      </span>
                    ) : null;
                  })}
                </div>

                {dish.modification_note && (
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Modification: </span>
                    {dish.modification_note}
                  </p>
                )}

                {dish.is_modifiable && (
                  <span className="inline-block mt-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Modifiable
                  </span>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(dish)}
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dish.id)}
                  className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {editingDish ? "Edit Dish" : "Add New Dish"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ingredients
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentIngredient}
                      onChange={(e) => setCurrentIngredient(e.target.value)}
                      placeholder="Add ingredient..."
                      className="flex-1 border rounded px-3 py-2"
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addIngredient())
                      }
                    />
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.ingredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Allergen Tags
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`p-2 rounded text-sm border flex items-center gap-2 ${
                          formData.allergen_tags.includes(allergen.id)
                            ? "text-white"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                        style={{
                          backgroundColor: formData.allergen_tags.includes(
                            allergen.id
                          )
                            ? allergen.color
                            : undefined,
                        }}
                      >
                        <span>{allergen.icon}</span>
                        <span>{allergen.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_modifiable}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_modifiable: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm font-medium">
                      This dish can be modified
                    </span>
                  </label>
                </div>

                {formData.is_modifiable && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Modification Instructions
                    </label>
                    <textarea
                      value={formData.modification_note}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          modification_note: e.target.value,
                        }))
                      }
                      placeholder="e.g., Can remove nuts, ask for no cheese, etc."
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : editingDish
                      ? "Update Dish"
                      : "Add Dish"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

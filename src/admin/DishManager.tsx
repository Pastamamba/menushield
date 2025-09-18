import { useState } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAuth } from "../auth/AuthContext";
import type { Dish, CreateDishRequest } from "../types";

export default function DishManager() {
  // CSV import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    // Simple CSV parser: name,description,price,category,ingredients,allergen_tags,components
    const rows = text.split(/\r?\n/).filter(Boolean);
    const header = rows[0].split(",").map((h) => h.trim());
    const dishes: CreateDishRequest[] = rows.slice(1).map((row) => {
      const cols = row.split(",");
      const obj: any = {};
      header.forEach((h, i) => {
        obj[h] = cols[i]?.trim() || "";
      });
      // Parse arrays
      obj.ingredients = obj.ingredients ? obj.ingredients.split(";").map((v: string) => v.trim()) : [];
      obj.allergen_tags = obj.allergen_tags ? obj.allergen_tags.split(";").map((v: string) => v.trim()) : [];
      // Parse components (main;sauce;side)
      obj.components = obj.components ? obj.components.split(";").map((c: string) => ({ name: c, type: "other", ingredients: [], allergen_tags: [], is_required: true })) : [];
      obj.price = obj.price ? parseFloat(obj.price) : undefined;
      return obj;
    });
    // Bulk create
    for (const dish of dishes) {
      try {
        await createDishMutation.mutateAsync(dish);
      } catch (err) {
        console.error("CSV import error:", err);
      }
    }
    alert(`Imported ${dishes.length} dishes!`);
  };
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Add New Dish
          </button>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
            Bulk Import CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVImport} />
          </label>
        </div>
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
  const [form, setForm] = useState<CreateDishRequest>({
    name: "",
    description: "",
    price: undefined,
    category: "",
    ingredients: [],
    allergen_tags: [],
    is_modifiable: true,
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: keyof CreateDishRequest, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value.split(",").map((v) => v.trim()).filter(Boolean) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Add New Dish</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input name="price" type="number" value={form.price ?? ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ingredients (comma separated)</label>
          <input name="ingredients" value={form.ingredients.join(", ")} onChange={(e) => handleArrayChange("ingredients", e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Allergen Tags (comma separated)</label>
          <input name="allergen_tags" value={form.allergen_tags.join(", ")} onChange={(e) => handleArrayChange("allergen_tags", e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex space-x-2 mt-4">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function EditDishForm({ dish, onSubmit, onCancel }: { dish: Dish; onSubmit: (data: Partial<CreateDishRequest>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<CreateDishRequest>>({
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: dish.category,
    ingredients: dish.ingredients,
    allergen_tags: dish.allergen_tags,
    is_modifiable: dish.is_modifiable,
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: keyof CreateDishRequest, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value.split(",").map((v) => v.trim()).filter(Boolean) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Edit Dish: {dish.name}</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name ?? ""} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description ?? ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input name="price" type="number" value={form.price ?? ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input name="category" value={form.category ?? ""} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ingredients (comma separated)</label>
          <input name="ingredients" value={Array.isArray(form.ingredients) ? form.ingredients.join(", ") : ""} onChange={(e) => handleArrayChange("ingredients", e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Allergen Tags (comma separated)</label>
          <input name="allergen_tags" value={Array.isArray(form.allergen_tags) ? form.allergen_tags.join(", ") : ""} onChange={(e) => handleArrayChange("allergen_tags", e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex space-x-2 mt-4">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}

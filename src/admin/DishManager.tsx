import { useState } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAdminIngredients } from "../utils/ingredientApi";
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
  
  const { data: dishes = [], isLoading, error } = useAdminDishes();
  const { data: availableIngredients = [] } = useAdminIngredients();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  // Filter and group dishes  
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const allCategories = ["all", ...Array.from(new Set(dishes.map(d => d.category || "Uncategorized")))];

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
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Dishes ({filteredDishes.length})</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Dish
          </button>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            Import CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVImport} />
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search dishes by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {allCategories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Dish List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-900 truncate">{dish.name}</h4>
                  {dish.category && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {dish.category}
                    </span>
                  )}
                  {dish.price && (
                    <span className="text-lg font-semibold text-green-600">
                      ${dish.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{dish.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400">
                    🥬 {Array.isArray(dish.ingredients) ? dish.ingredients.length : 0} ingredients
                  </span>
                  <span className="text-xs text-gray-400">
                    ⚠️ {Array.isArray(dish.allergen_tags) ? dish.allergen_tags.length : 0} allergens
                  </span>
                  {Array.isArray(dish.allergen_tags) && dish.allergen_tags.length > 0 && (
                    <span className="text-xs text-orange-600">
                      {dish.allergen_tags.slice(0, 3).join(", ")}
                      {dish.allergen_tags.length > 3 && "..."}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setEditingDish(dish)}
                  className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                  title="Edit dish"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Delete dish"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {filteredDishes.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== "all" 
                  ? "No dishes match your search criteria"
                  : "No dishes found. Add your first dish!"
                }
              </p>
            </div>
          )}
        </div>
      </div>

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
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowCreateForm(false)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <CreateDishForm
              onSubmit={handleCreateDish}
              onCancel={() => setShowCreateForm(false)}
              availableIngredients={availableIngredients}
            />
          </div>
        </div>
      )}

      {editingDish && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setEditingDish(null)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <EditDishForm
              dish={editingDish}
              onSubmit={(data) => handleUpdateDish(editingDish.id, data)}
              onCancel={() => setEditingDish(null)}
              availableIngredients={availableIngredients}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder forms - these would need to be implemented
function CreateDishForm({ onSubmit, onCancel, availableIngredients }: { 
  onSubmit: (data: CreateDishRequest) => void; 
  onCancel: () => void;
  availableIngredients: any[];
}) {
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
    <div className="p-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Add New Dish</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
              placeholder="Enter dish name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
              placeholder="e.g., Main Course, Appetizer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="Describe the dish"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
          <input 
            name="price" 
            type="number" 
            step="0.01"
            value={form.price ?? ""} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <IngredientSelector 
            selectedIngredients={form.ingredients}
            availableIngredients={availableIngredients}
            onChange={(ingredients: string[]) => setForm(prev => ({ ...prev, ingredients }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allergen Tags</label>
          <input 
            name="allergen_tags" 
            value={form.allergen_tags.join(", ")} 
            onChange={(e) => handleArrayChange("allergen_tags", e.target.value)} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="gluten, dairy, nuts (comma separated)"
          />
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <button 
            type="submit" 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Save Dish
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EditDishForm({ dish, onSubmit, onCancel, availableIngredients }: { 
  dish: Dish; 
  onSubmit: (data: Partial<CreateDishRequest>) => void; 
  onCancel: () => void;
  availableIngredients: any[];
}) {
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
    <div className="p-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Edit Dish: {dish.name}</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input 
              name="name" 
              value={form.name ?? ""} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
              placeholder="Enter dish name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input 
              name="category" 
              value={form.category ?? ""} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
              placeholder="e.g., Main Course, Appetizer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea 
            name="description" 
            value={form.description ?? ""} 
            onChange={handleChange} 
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="Describe the dish"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
          <input 
            name="price" 
            type="number" 
            step="0.01"
            value={form.price ?? ""} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <IngredientSelector 
            selectedIngredients={Array.isArray(form.ingredients) ? form.ingredients : []}
            availableIngredients={availableIngredients}
            onChange={(ingredients: string[]) => setForm(prev => ({ ...prev, ingredients }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allergen Tags</label>
          <input 
            name="allergen_tags" 
            value={Array.isArray(form.allergen_tags) ? form.allergen_tags.join(", ") : ""} 
            onChange={(e) => handleArrayChange("allergen_tags", e.target.value)} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
            placeholder="gluten, dairy, nuts (comma separated)"
          />
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <button 
            type="submit" 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Update Dish
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
// Ingredient Selector Component
interface IngredientSelectorProps {
  selectedIngredients: string[];
  availableIngredients: any[];
  onChange: (ingredients: string[]) => void;
}

function IngredientSelector({ selectedIngredients, availableIngredients, onChange }: IngredientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedIngredients.includes(ingredient.name)
  );

  const addIngredient = (ingredientName: string) => {
    onChange([...selectedIngredients, ingredientName]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removeIngredient = (ingredientName: string) => {
    onChange(selectedIngredients.filter(name => name !== ingredientName));
  };

  return (
    <div className="space-y-3">
      {/* Search and add */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          placeholder="Search and select ingredients..."
        />
        
        {/* Dropdown */}
        {showDropdown && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => addIngredient(ingredient.name)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium">{ingredient.name}</div>
                  {ingredient.category && (
                    <div className="text-sm text-gray-500">{ingredient.category}</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                No ingredients found. Try a different search term.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIngredients.map((ingredient) => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(ingredient)}
                className="text-green-500 hover:text-green-700 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}



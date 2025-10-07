import { useState } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAdminIngredients } from "../utils/ingredientApi";
import { calculateAllergensFromIngredients, getAllergenChips } from "../utils/allergenCalculator";
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
    if (confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteDishMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete dish:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dishes ({filteredDishes.length})</h2>
          <p className="text-gray-600">Manage your restaurant's menu items</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
            id="csv-import"
          />
          <label
            htmlFor="csv-import"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>📄</span>
            Import CSV
          </label>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add Dish
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {allCategories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dishes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredDishes.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredDishes.map((dish) => (
              <div key={dish.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{dish.name}</h3>
                      {dish.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {dish.category}
                        </span>
                      )}
                      {dish.price && (
                        <span className="text-lg font-bold text-green-600">
                          ${dish.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {dish.description && (
                      <p className="text-gray-600 mb-3">{dish.description}</p>
                    )}
                    
                    {/* Ingredients */}
                    {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {dish.ingredients.slice(0, 5).map((ingredient) => (
                            <span
                              key={ingredient}
                              className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
                            >
                              {ingredient}
                            </span>
                          ))}
                          {dish.ingredients.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{dish.ingredients.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Allergens */}
                    {Array.isArray(dish.allergen_tags) && dish.allergen_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getAllergenChips(dish.allergen_tags.slice(0, 4)).map((allergen) => (
                          <span
                            key={allergen.name}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${allergen.color}`}
                          >
                            <span>{allergen.icon}</span>
                            <span className="capitalize">{allergen.name}</span>
                          </span>
                        ))}
                        {dish.allergen_tags.length > 4 && (
                          <span className="text-xs text-gray-600">
                            +{dish.allergen_tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingDish(dish)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                      title="Edit dish"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2"
                      title="Delete dish"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first dish"}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <span>+</span>
              Add First Dish
            </button>
          </div>
        )}
      </div>

      {/* Create Dish Modal */}
      {showCreateForm && (
        <CreateDishModal
          onSubmit={handleCreateDish}
          onCancel={() => setShowCreateForm(false)}
          availableIngredients={availableIngredients}
        />
      )}

      {/* Edit Dish Modal */}
      {editingDish && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setEditingDish(null)}
          />
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

// Two-page centered modal for creating dishes
function CreateDishModal({ onSubmit, onCancel, availableIngredients }: { 
  onSubmit: (data: CreateDishRequest) => void; 
  onCancel: () => void;
  availableIngredients: any[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<CreateDishRequest>({
    name: "",
    description: "",
    price: 0,
    category: "",
    ingredients: [],
    allergen_tags: [],
    is_modifiable: true,
    components: []
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === "number" ? (value ? parseFloat(value) : 0) : value
      }));
    }
  };

  const handleIngredientsChange = (ingredients: string[]) => {
    const allergens = calculateAllergensFromIngredients(ingredients, availableIngredients);
    setForm(prev => ({ 
      ...prev, 
      ingredients,
      allergen_tags: allergens
    }));
  };

  const handleNextPage = () => {
    if (!form.name.trim()) {
      setError("Dish name is required");
      return;
    }
    setError("");
    setCurrentPage(2);
  };

  const handlePreviousPage = () => {
    setCurrentPage(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ingredients.length === 0) {
      setError("At least one ingredient is required");
      return;
    }
    setError("");
    onSubmit(form);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Create New Dish</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-100 text-sm">Step {currentPage} of 2</span>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${currentPage >= 1 ? 'bg-white' : 'bg-green-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${currentPage >= 2 ? 'bg-white' : 'bg-green-300'}`}></div>
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-green-100 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {currentPage === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
                  <p className="text-gray-600 text-sm">Enter the basic details about your dish</p>
                </div>

                {/* Dish Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dish Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-lg" 
                    placeholder="e.g., Grilled Salmon with Herbs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none" 
                    placeholder="Describe your dish, cooking method, or special features..."
                  />
                </div>

                {/* Category and Price Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select a category</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Salad">Salad</option>
                      <option value="Soup">Soup</option>
                      <option value="Side Dish">Side Dish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input 
                      name="price" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.price} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Modifiable Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="is_modifiable"
                    checked={form.is_modifiable}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-900">Allow Modifications</label>
                    <p className="text-xs text-gray-600">Customers can request ingredient changes</p>
                  </div>
                </div>
              </div>
            )}

            {currentPage === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients & Allergens</h3>
                  <p className="text-gray-600 text-sm">Select ingredients - allergens will be calculated automatically</p>
                </div>

                {/* Ingredients Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ingredients <span className="text-red-500">*</span>
                  </label>
                  <IngredientSelector 
                    selectedIngredients={form.ingredients}
                    availableIngredients={availableIngredients}
                    onChange={handleIngredientsChange}
                  />
                  
                  {form.ingredients.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
                      <span className="text-4xl mb-2 block">🍽️</span>
                      <p className="text-gray-500 font-medium">No ingredients selected yet</p>
                      <p className="text-gray-400 text-sm">Start typing above to add ingredients</p>
                    </div>
                  )}
                </div>

                {/* Auto-calculated Allergens */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Detected Allergens
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Auto-calculated
                    </span>
                  </h4>
                  
                  <div className="min-h-[3rem] p-3 border border-orange-200 rounded-lg bg-white">
                    {form.allergen_tags.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {getAllergenChips(form.allergen_tags).map((allergen) => (
                            <span
                              key={allergen.name}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                            >
                              <span>{allergen.icon}</span>
                              <span className="capitalize">{allergen.name}</span>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-orange-600 font-medium">
                          ⚡ These allergens are automatically detected from your selected ingredients
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-2xl mb-1 block">✅</span>
                        <p className="text-green-600 font-medium text-sm">No allergens detected</p>
                        <p className="text-gray-500 text-xs">Add ingredients to see potential allergens</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          {currentPage === 1 ? (
            <>
              <button 
                type="button" 
                onClick={onCancel} 
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleNextPage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                Next: Ingredients
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                onClick={handlePreviousPage}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button 
                type="submit" 
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                disabled={form.ingredients.length === 0}
              >
                <span className="mr-2">✨</span>
                Create Dish
              </button>
            </>
          )}
        </div>
      </div>
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
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value
    }));
  };

  const handleIngredientsChange = (ingredients: string[]) => {
    const allergens = calculateAllergensFromIngredients(ingredients, availableIngredients);
    setForm(prev => ({ 
      ...prev, 
      ingredients,
      allergen_tags: allergens
    }));
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
          <label className="block text-sm font-medium text-gray-700 mb-3">Ingredients</label>
          <IngredientSelector 
            selectedIngredients={form.ingredients || []}
            availableIngredients={availableIngredients}
            onChange={handleIngredientsChange}
          />
        </div>

        {form.allergen_tags && form.allergen_tags.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Auto-calculated Allergens</h4>
            <div className="flex flex-wrap gap-2">
              {getAllergenChips(form.allergen_tags).map((allergen) => (
                <span
                  key={allergen.name}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${allergen.color}`}
                >
                  <span>{allergen.icon}</span>
                  <span className="capitalize">{allergen.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Update Dish
          </button>
        </div>
      </form>
    </div>
  );
}

function IngredientSelector({ selectedIngredients, availableIngredients, onChange }: {
  selectedIngredients: string[];
  availableIngredients: any[];
  onChange: (ingredients: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedIngredients.includes(ingredient.name)
  );

  const addIngredient = (ingredientName: string) => {
    if (!selectedIngredients.includes(ingredientName)) {
      onChange([...selectedIngredients, ingredientName]);
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  const removeIngredient = (ingredientName: string) => {
    onChange(selectedIngredients.filter(name => name !== ingredientName));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search and add ingredients..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => setIsOpen(searchTerm.length > 0)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
        />
        
        {/* Dropdown Results */}
        {isOpen && filteredIngredients.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredIngredients.slice(0, 8).map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => addIngredient(ingredient.name)}
                className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">🥬</span>
                  <span className="font-medium">{ingredient.name}</span>
                </div>
              </button>
            ))}
            {filteredIngredients.length > 8 && (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                ... and {filteredIngredients.length - 8} more matches
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Selected Ingredients ({selectedIngredients.length})</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {selectedIngredients.map((ingredient) => (
              <div
                key={ingredient}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 group hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">🥬</span>
                  <span className="font-medium text-green-800">{ingredient}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(ingredient)}
                  className="text-green-600 hover:text-red-600 hover:bg-red-50 rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title={`Remove ${ingredient}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Suggestions */}
      {selectedIngredients.length === 0 && !searchTerm && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Popular Ingredients</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {availableIngredients.slice(0, 8).map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => addIngredient(ingredient.name)}
                className="flex items-center justify-center bg-gray-50 hover:bg-green-50 hover:border-green-300 border border-gray-200 rounded-lg px-3 py-2 transition-all duration-200 text-sm font-medium hover:text-green-700"
              >
                <span className="mr-2">🥬</span>
                {ingredient.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAdminIngredients } from "../utils/ingredientApi";
import { useRestaurant } from "../utils/restaurantApi";
import { calculateAllergensFromIngredients, getAllergenChips } from "../utils/allergenCalculator";
import { formatPrice, getCurrencySymbol } from "../utils/currency";
import { useAdminTranslations } from "../hooks/useAdminTranslations";
import logger from "../utils/logger";
import type { Dish, CreateDishRequest } from "../types";
import type { AllergenLanguage } from "../utils/allergenTranslations";

export default function DishManager() {
  const { currentLanguage } = useAdminTranslations();
  
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
  const { data: restaurant } = useRestaurant();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // Prevent body scroll when modals are open
  useEffect(() => {
    const isModalOpen = showCreateForm || editingDish;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateForm, editingDish]);

  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();
  
  // Debug logs to trace the data
  logger.debug('DishManager data:', { dishes, availableIngredients, restaurant });

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
    
    // Handle category as either string or object
    const categoryName = (dish.category as any)?.name || dish.category || "Uncategorized";
    const matchesCategory = selectedCategory === "all" || categoryName === selectedCategory;
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && dish.is_active !== false) ||
                         (statusFilter === "inactive" && dish.is_active === false);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter dropdown - handle both string and object categories
  const allCategories = ["all", ...Array.from(new Set(dishes.map(d => {
    return (d.category as any)?.name || d.category || "Uncategorized";
  })))];

  logger.debug('Categories for dropdown:', allCategories);

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

  const handleToggleActivation = async (dish: Dish) => {
    try {
      await updateDishMutation.mutateAsync({
        id: dish.id,
        dish: {
          is_active: !dish.is_active
        }
      });
    } catch (error) {
      console.error("Error toggling dish activation:", error);
      alert("Failed to update dish status. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search and actions - More refined */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-warm-gray-900">Dishes ({filteredDishes.length})</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-sage-600 text-white px-3 py-2 rounded-lg hover:bg-sage-700 transition-all duration-200 active:scale-98 font-medium"
          >
            + Add Dish
          </button>
          <label className="bg-warm-gray-600 text-white px-3 py-2 rounded-lg hover:bg-warm-gray-700 cursor-pointer transition-all duration-200 active:scale-98 font-medium">
            Import CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVImport} />
          </label>
        </div>
      </div>

      {/* Search and Filters - More compact */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-warm-gray-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search dishes by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-warm-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sage-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-warm-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sage-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {allCategories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Compact Dish List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${
              dish.is_active === false ? 'opacity-60 bg-gray-50' : ''
            }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className={`text-lg font-medium truncate ${
                    dish.is_active === false ? 'text-gray-500' : 'text-gray-900'
                  }`}>{dish.name}</h4>
                  {dish.is_active === false && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Inactive
                    </span>
                  )}
                  {((dish.category as any)?.name || dish.category) && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {(dish.category as any)?.name || dish.category}
                    </span>
                  )}
                  {dish.price && (
                    <span className="text-lg font-semibold text-green-600">
                      {formatPrice(dish.price, restaurant?.currency || 'EUR')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{dish.description}</p>
                
                {/* Ingredients chips */}
                {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {dish.ingredients.slice(0, 4).map((ingredient) => (
                        <span
                          key={ingredient}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                        >
                          {ingredient}
                        </span>
                      ))}
                      {dish.ingredients.length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          +{dish.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergen chips */}
                {Array.isArray(dish.allergen_tags) && dish.allergen_tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {getAllergenChips(dish.allergen_tags.slice(0, 3), currentLanguage as AllergenLanguage).map((allergen) => (
                        <span
                          key={allergen.name}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                        >
                          <span className="capitalize">{allergen.displayName}</span>
                        </span>
                      ))}
                      {dish.allergen_tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          +{dish.allergen_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400">
                    {Array.isArray(dish.ingredients) ? dish.ingredients.length : 0} ingredients
                  </span>
                  <span className="text-xs text-gray-400">
                    {Array.isArray(dish.allergen_tags) ? dish.allergen_tags.length : 0} allergens
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {/* Activation Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActivation(dish)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      dish.is_active !== false ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                    title={dish.is_active !== false ? "Deactivate dish" : "Activate dish"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dish.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${
                    dish.is_active !== false ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {dish.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <button
                  onClick={() => setEditingDish(dish)}
                  className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                  title="Edit dish"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Delete dish"
                >
                  Delete
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
        <CreateDishModal
          onSubmit={handleCreateDish}
          onCancel={() => setShowCreateForm(false)}
          availableIngredients={availableIngredients}
          restaurant={restaurant}
        />
      )}

      {editingDish && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setEditingDish(null)}
        >
          {/* Centered professional modal */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all">
            <EditDishForm
              dish={editingDish}
              onSubmit={(data) => handleUpdateDish(editingDish.id, data)}
              onCancel={() => setEditingDish(null)}
              availableIngredients={availableIngredients}
              restaurant={restaurant}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Two-page centered modal for creating dishes
function CreateDishModal({ onSubmit, onCancel, availableIngredients, restaurant }: { 
  onSubmit: (data: CreateDishRequest) => void; 
  onCancel: () => void;
  availableIngredients: any[];
  restaurant?: any;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Component group definitions - now stateful for toggleable modifiability
  const [componentGroups, setComponentGroups] = useState([
    { id: 'main', name: 'Main Component', canChange: false, icon: '🍽️' },
    { id: 'base', name: 'Base', canChange: true, icon: '🍞' },
    { id: 'side', name: 'Side Dish', canChange: true, icon: '🥗' },
    { id: 'sauce', name: 'Sauce/Dip', canChange: true, icon: '🫙' },
    { id: 'topping', name: 'Topping/Garnish', canChange: true, icon: '🌿' }
  ]);

  const [form, setForm] = useState<CreateDishRequest>({
    name: "",
    description: "",
    price: 0,
    category: "",
    ingredients: [],
    allergen_tags: [],
    is_modifiable: true,
    is_active: true,
    components: []
  });
  
  // Component groups state - track ingredients by group
  const [componentIngredients, setComponentIngredients] = useState<{[key: string]: string[]}>({
    main: [],
    base: [],
    side: [],
    sauce: [],
    topping: []
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

  // Handle ingredient changes for component groups
  const handleComponentIngredientsChange = (groupId: string, ingredients: string[]) => {
    setComponentIngredients(prev => ({
      ...prev,
      [groupId]: ingredients
    }));
    
    // Update form with all ingredients and calculate allergens
    const allIngredients = Object.values({
      ...componentIngredients,
      [groupId]: ingredients
    }).flat();
    
    const allergens = calculateAllergensFromIngredients(allIngredients, availableIngredients);
    
    // Create components for the dish
    const components = componentGroups.map(group => ({
      name: group.name,
      type: group.id === 'main' ? 'base' as const : 
            group.id === 'base' ? 'base' as const :
            group.id === 'side' ? 'side' as const :
            group.id === 'sauce' ? 'sauce' as const :
            group.id === 'topping' ? 'garnish' as const :
            'other' as const,
      ingredients: componentIngredients[group.id] || [],
      allergen_tags: calculateAllergensFromIngredients(componentIngredients[group.id] || [], availableIngredients),
      is_required: !group.canChange,
      is_locked: !group.canChange
    })).filter(comp => comp.ingredients.length > 0);
    
    setForm(prev => ({ 
      ...prev, 
      ingredients: allIngredients,
      allergen_tags: allergens,
      components: components
    }));
  };

  // Toggle component group modifiability (except main component)
  const handleToggleGroupModifiability = (groupId: string) => {
    if (groupId === 'main') return; // Main component cannot be changed
    
    setComponentGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, canChange: !group.canChange }
        : group
    ));
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
    if (componentIngredients.main.length === 0) {
      setError("At least one main component ingredient is required");
      return;
    }
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

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Add escape key listener and handle body scroll
  useState(() => {
    document.addEventListener('keydown', handleEscapeKey);
    // Prevent background scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  });

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ({getCurrencySymbol(restaurant?.currency || 'EUR')})
                    </label>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredient Components</h3>
                  <p className="text-gray-600 text-sm">Organize ingredients into component groups</p>
                </div>

                {/* Component Groups */}
                <div className="space-y-4">
                  {componentGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{group.icon}</span>
                          <h4 className="font-semibold text-gray-900">{group.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            group.canChange 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {group.canChange ? 'Modifiable' : 'Required'}
                          </span>
                        </div>
                        
                        {/* Toggle for modifiability (except main component) */}
                        {group.id !== 'main' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Can be changed:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleGroupModifiability(group.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                group.canChange ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  group.canChange ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <IngredientSelector 
                        selectedIngredients={componentIngredients[group.id] || []}
                        availableIngredients={availableIngredients}
                        onChange={(ingredients) => handleComponentIngredientsChange(group.id, ingredients)}
                        placeholder={`Select ${group.name.toLowerCase()} ingredients...`}
                      />
                      
                      {group.id === 'main' && componentIngredients[group.id]?.length === 0 && (
                        <div className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Main component is required
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total ingredients summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📊</span>
                    Ingredient Summary
                  </h5>
                  <div className="text-sm text-gray-600">
                    <p>Total ingredients: <span className="font-semibold">{form.ingredients.length}</span></p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {componentGroups.map(group => {
                        const count = componentIngredients[group.id]?.length || 0;
                        return count > 0 ? (
                          <span key={group.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs border">
                            <span>{group.icon}</span>
                            <span>{group.name}: {count}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Auto-calculated Allergens */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    Detected Allergens
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Auto-calculated
                    </span>
                  </h4>
                  
                  <div className="min-h-[3rem] p-3 border border-orange-200 rounded-lg bg-white">
                    {form.allergen_tags.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {getAllergenChips(form.allergen_tags, currentLanguage as AllergenLanguage).map((allergen) => (
                            <span
                              key={allergen.name}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                            >
                              <span className="capitalize">{allergen.displayName}</span>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-orange-600 font-medium">
                          These allergens are automatically detected from your selected ingredients
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
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
                disabled={componentIngredients.main.length === 0}
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

function EditDishForm({ dish, onSubmit, onCancel, availableIngredients, restaurant }: { 
  dish: Dish; 
  onSubmit: (data: Partial<CreateDishRequest>) => void; 
  onCancel: () => void;
  availableIngredients: any[];
  restaurant?: any;
}) {
  const [form, setForm] = useState<Partial<CreateDishRequest>>({
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: (dish.category as any)?.name || dish.category,
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
      allergen_tags: allergens // Auto-update allergens
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
    <div className="max-h-[90vh] overflow-hidden">
      {/* Professional Header - Same style as CreateDishModal */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Dish</h2>
            <p className="text-blue-100 text-sm">{dish.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-blue-100 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

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
        <form id="edit-dish-form" onSubmit={handleSubmit} className="space-y-6">
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
            <select
              name="category"
              value={form.category ?? ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price ({getCurrencySymbol(restaurant?.currency || 'EUR')})
          </label>
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
            onChange={handleIngredientsChange}
          />
        </div>

        {/* Auto-calculated Allergens Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allergens (Auto-calculated from ingredients)
          </label>
          <div className="min-h-[3rem] p-3 border border-gray-200 rounded-lg bg-gray-50">
            {Array.isArray(form.allergen_tags) && form.allergen_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getAllergenChips(form.allergen_tags, currentLanguage as AllergenLanguage).map((allergen) => (
                  <span
                    key={allergen.name}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                  >
                    <span className="capitalize">{allergen.displayName}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No allergens detected. Add ingredients to see allergens.</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Allergens are automatically calculated based on selected ingredients. 
            Update ingredients to modify allergens.
          </p>
        </div>
        </form>
      </div>

      {/* Professional Modal Footer - Same style as CreateDishModal */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="edit-dish-form"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
// Ingredient Selector Component
interface IngredientSelectorProps {
  selectedIngredients: string[];
  availableIngredients: any[];
  onChange: (ingredients: string[]) => void;
  placeholder?: string;
}

function IngredientSelector({ selectedIngredients, availableIngredients, onChange, placeholder = "Search and select ingredients..." }: IngredientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Safety checks for props
  const safeSelectedIngredients = Array.isArray(selectedIngredients) ? selectedIngredients : [];
  const safeAvailableIngredients = Array.isArray(availableIngredients) ? availableIngredients : [];

  const filteredIngredients = safeAvailableIngredients.filter(ingredient =>
    ingredient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !safeSelectedIngredients.includes(ingredient.name)
  );

  const addIngredient = (ingredientName: string) => {
    onChange([...safeSelectedIngredients, ingredientName]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removeIngredient = (ingredientName: string) => {
    onChange(safeSelectedIngredients.filter(name => name !== ingredientName));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            placeholder={placeholder}
          />
        </div>
        
        {/* Dropdown */}
        {showDropdown && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredIngredients.length > 0 ? (
              <div className="py-2">
                {filteredIngredients.slice(0, 8).map((ingredient) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => addIngredient(ingredient.name)}
                    className="w-full px-4 py-3 text-left hover:bg-green-50 hover:text-green-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{ingredient.name}</span>
                      {ingredient.category && (
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {ingredient.category}
                        </span>
                      )}
                    </div>
                    <span className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      + Add
                    </span>
                  </button>
                ))}
                {filteredIngredients.length > 8 && (
                  <div className="px-4 py-2 text-sm text-gray-500 border-t">
                    ... and {filteredIngredients.length - 8} more matches
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                <span className="text-2xl block mb-2">😕</span>
                <p className="font-medium">No ingredients found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Ingredients */}
      {safeSelectedIngredients.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-700">Selected Ingredients</h5>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {safeSelectedIngredients.length} ingredient{safeSelectedIngredients.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {safeSelectedIngredients.map((ingredient) => (
              <div
                key={ingredient}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 group hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
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


    </div>
  );
}



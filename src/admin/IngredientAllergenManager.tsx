import { useState, useEffect } from "react";
import { useAdminIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient } from "../utils/ingredientApi";
import { useAdminTranslations } from "../hooks/useAdminTranslations";
import logger from "../utils/logger";
import type { Ingredient, CreateIngredientRequest } from "../types";

// Available allergens with translations
const ALLERGEN_OPTIONS = [
  { key: 'gluten', label: { en: 'Gluten', fi: 'Gluteeni', sv: 'Gluten' }, color: 'bg-red-100 text-red-800 border-red-200' },
  { key: 'dairy', label: { en: 'Dairy', fi: 'Maitotuotteet', sv: 'Mejeri' }, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'eggs', label: { en: 'Eggs', fi: 'Kananmunat', sv: 'Ägg' }, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { key: 'fish', label: { en: 'Fish', fi: 'Kala', sv: 'Fisk' }, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'shellfish', label: { en: 'Shellfish', fi: 'Äyriäiset', sv: 'Skaldjur' }, color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { key: 'nuts', label: { en: 'Tree Nuts', fi: 'Pähkinät', sv: 'Nötter' }, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { key: 'peanuts', label: { en: 'Peanuts', fi: 'Maapähkinät', sv: 'Jordnötter' }, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { key: 'soy', label: { en: 'Soy', fi: 'Soija', sv: 'Soja' }, color: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'sesame', label: { en: 'Sesame', fi: 'Seesami', sv: 'Sesam' }, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'celery', label: { en: 'Celery', fi: 'Selleri', sv: 'Selleri' }, color: 'bg-lime-100 text-lime-800 border-lime-200' },
  { key: 'mustard', label: { en: 'Mustard', fi: 'Sinappi', sv: 'Senap' }, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'sulfites', label: { en: 'Sulfites', fi: 'Sulfiitit', sv: 'Sulfiter' }, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'lupin', label: { en: 'Lupin', fi: 'Lupiini', sv: 'Lupin' }, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { key: 'mollusks', label: { en: 'Mollusks', fi: 'Nilviäiset', sv: 'Blötdjur' }, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' }
];

export default function IngredientAllergenManager() {
  const { t, currentLanguage } = useAdminTranslations();
  
  // Check if feature should be visible
  const isVisible = import.meta.env.VITE_SHOW_INGREDIENT_MANAGER === 'true' || 
                   import.meta.env.DEV; // Always show in development
  
  if (!isVisible) {
    return null; // Don't render if flag is not set
  }

  const { data: ingredients = [], isLoading, error, refetch } = useAdminIngredients();
  const createIngredientMutation = useCreateIngredient();
  const updateIngredientMutation = useUpdateIngredient();
  const deleteIngredientMutation = useDeleteIngredient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState("all");

  // Debug logs
  logger.debug('IngredientAllergenManager data:', { ingredients });

  // Get translated allergen label
  const getAllergenLabel = (allergenKey: string) => {
    const allergen = ALLERGEN_OPTIONS.find(a => a.key === allergenKey);
    if (!allergen) return allergenKey;
    return allergen.label[currentLanguage as keyof typeof allergen.label] || allergen.label.en;
  };

  // Get allergen color class
  const getAllergenColor = (allergenKey: string) => {
    const allergen = ALLERGEN_OPTIONS.find(a => a.key === allergenKey);
    return allergen?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAllergen = selectedAllergenFilter === "all" || 
                           (Array.isArray(ingredient.allergenTags) && 
                            ingredient.allergenTags.includes(selectedAllergenFilter));
    
    return matchesSearch && matchesAllergen;
  });

  // Get unique allergens for filter dropdown
  const allAllergens = ["all", ...Array.from(new Set(
    ingredients.flatMap(i => Array.isArray(i.allergenTags) ? i.allergenTags : [])
  ))];

  const handleCreateIngredient = async (ingredientData: CreateIngredientRequest) => {
    try {
      console.log('🧄 Creating ingredient:', ingredientData);
      await createIngredientMutation.mutateAsync(ingredientData);
      setShowCreateForm(false);
      refetch(); // Refresh the list
    } catch (error) {
      console.error("Failed to create ingredient:", error);
      alert(`Failed to create ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateIngredient = async (id: string, ingredientData: Partial<CreateIngredientRequest>) => {
    try {
      await updateIngredientMutation.mutateAsync({ id, data: ingredientData });
      setEditingIngredient(null);
      refetch(); // Refresh the list
    } catch (error) {
      console.error("Failed to update ingredient:", error);
      alert(`Failed to update ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await deleteIngredientMutation.mutateAsync(id);
        refetch(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete ingredient:", error);
        alert(`Failed to delete ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Ingredient & Allergen Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Ingredient & Allergen Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-red-600">Error loading ingredients: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            🧄 Ingredient & Allergen Manager ({filteredIngredients.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect ingredients to allergens for automatic allergen calculation in dishes
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search ingredients by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedAllergenFilter}
            onChange={(e) => setSelectedAllergenFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Allergens</option>
            {allAllergens.slice(1).map(allergen => (
              <option key={allergen} value={allergen}>{getAllergenLabel(allergen)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ingredient List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredIngredients.map((ingredient) => (
            <div key={ingredient.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium text-gray-900">{ingredient.name}</h4>
                    {ingredient.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {typeof ingredient.category === 'string' ? ingredient.category : ingredient.category.name}
                      </span>
                    )}
                    {!ingredient.isActive && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {ingredient.description && (
                    <p className="text-sm text-gray-500 mt-1">{ingredient.description}</p>
                  )}
                  
                  {/* Allergen Tags */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(ingredient.allergenTags) && ingredient.allergenTags.length > 0 ? (
                        ingredient.allergenTags.map((allergen: string) => (
                          <span
                            key={allergen}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getAllergenColor(allergen)}`}
                          >
                            {getAllergenLabel(allergen)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">No allergens</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingIngredient(ingredient)}
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteIngredient(ingredient.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredIngredients.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {searchTerm || selectedAllergenFilter !== "all" 
                  ? "No ingredients match your search criteria"
                  : "No ingredients found. Add your first ingredient!"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ingredient Modal */}
      {showCreateForm && (
        <IngredientModal
          onSubmit={handleCreateIngredient}
          onCancel={() => setShowCreateForm(false)}
          allergenOptions={ALLERGEN_OPTIONS}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Edit Ingredient Modal */}
      {editingIngredient && (
        <IngredientModal
          ingredient={editingIngredient}
          onSubmit={(data) => handleUpdateIngredient(editingIngredient.id, data)}
          onCancel={() => setEditingIngredient(null)}
          allergenOptions={ALLERGEN_OPTIONS}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
}

// Ingredient Creation/Edit Modal
interface IngredientModalProps {
  ingredient?: Ingredient;
  onSubmit: (data: CreateIngredientRequest) => void;
  onCancel: () => void;
  allergenOptions: typeof ALLERGEN_OPTIONS;
  currentLanguage: string;
}

function IngredientModal({ ingredient, onSubmit, onCancel, allergenOptions, currentLanguage }: IngredientModalProps) {
  const [form, setForm] = useState<CreateIngredientRequest>({
    name: ingredient?.name || "",
    category: ingredient?.category ? (typeof ingredient.category === 'string' ? ingredient.category : ingredient.category.name) : "",
    allergen_tags: ingredient?.allergenTags || [],
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAllergenToggle = (allergenKey: string) => {
    setForm(prev => ({
      ...prev,
      allergen_tags: prev.allergen_tags.includes(allergenKey)
        ? prev.allergen_tags.filter(a => a !== allergenKey)
        : [...prev.allergen_tags, allergenKey]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Ingredient name is required");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {ingredient ? 'Edit Ingredient' : 'Create New Ingredient'}
            </h2>
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
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Salmon, Wheat Flour, Milk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  name="category"
                  value={form.category || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Proteins, Grains, Vegetables"
                />
              </div>
            </div>

            {/* Allergen Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allergens <span className="text-sm text-gray-500">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allergenOptions.map((allergen) => {
                  const isSelected = form.allergen_tags.includes(allergen.key);
                  return (
                    <label
                      key={allergen.key}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAllergenToggle(allergen.key)}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium">
                        {allergen.label[currentLanguage as keyof typeof allergen.label] || allergen.label.en}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
              <strong>Note:</strong> Only name, category, and allergen tags are currently supported for ingredients. 
              All ingredients are automatically set as active.
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {ingredient ? 'Update' : 'Create'} Ingredient
          </button>
        </div>
      </div>
    </div>
  );
}
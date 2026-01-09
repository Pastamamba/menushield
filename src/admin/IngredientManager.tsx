import { useState } from "react";
import { useAdminIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient } from "../utils/ingredientApi";
import { COMMON_ALLERGENS, getSuggestedAllergens, getAllergenChips } from "../utils/allergenCalculator";
import { useAdminTranslations } from "../hooks/useAdminTranslations";
import type { Ingredient, CreateIngredientRequest } from "../types";
import type { AllergenLanguage } from "../utils/allergenTranslations";

interface IngredientManagerProps {
  token: string;
}

export default function IngredientManager(_props: IngredientManagerProps) {
  const { currentLanguage } = useAdminTranslations();
  const { data: ingredients = [], isLoading, error } = useAdminIngredients();
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const createIngredientMutation = useCreateIngredient();
  const updateIngredientMutation = useUpdateIngredient();
  const deleteIngredientMutation = useDeleteIngredient();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Ingredient Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Ingredient Manager</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-red-600">Error loading ingredients: {error.message}</p>
        </div>
      </div>
    );
  }

  const filteredIngredients = ingredients.filter(ingredient => {
    const nameMatch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = typeof ingredient.category === 'string' ? 
      ingredient.category.toLowerCase().includes(searchTerm.toLowerCase()) :
      ingredient.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return nameMatch || categoryMatch;
  });

  const handleCreateIngredient = async (ingredientData: CreateIngredientRequest) => {
    try {
      await createIngredientMutation.mutateAsync(ingredientData);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create ingredient:", error);
    }
  };

  const handleUpdateIngredient = async (id: string, ingredientData: Partial<CreateIngredientRequest>) => {
    try {
      await updateIngredientMutation.mutateAsync({ id, data: ingredientData });
      setEditingIngredient(null);
    } catch (error) {
      console.error("Failed to update ingredient:", error);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await deleteIngredientMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete ingredient:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Ingredients ({filteredIngredients.length})</h2>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search ingredients by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Ingredients List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredIngredients.map((ingredient) => (
            <div key={ingredient.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-900">{ingredient.name}</h4>
                  {ingredient.category && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {typeof ingredient.category === 'string' ? ingredient.category : ingredient.category.name}
                    </span>
                  )}
                </div>
                
                {/* Allergen chips */}
                <div className="mt-2">
                  {(() => {
                    console.log(`🔍 ${ingredient.name} allergen debug:`, {
                      allergen_tags: ingredient.allergen_tags,
                      type: typeof ingredient.allergen_tags,
                      isArray: Array.isArray(ingredient.allergen_tags),
                      length: ingredient.allergen_tags?.length,
                      fullIngredient: ingredient
                    });
                    return null;
                  })()}
                  {ingredient.allergen_tags && ingredient.allergen_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {getAllergenChips(ingredient.allergen_tags, currentLanguage as AllergenLanguage).map((allergen) => (
                        <span
                          key={allergen.name}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                        >
                          <span className="capitalize">{allergen.displayName}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No allergens</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setEditingIngredient(ingredient)}
                  className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                  title="Edit ingredient"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteIngredient(ingredient.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Delete ingredient"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {filteredIngredients.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {searchTerm 
                  ? "No ingredients match your search criteria"
                  : "No ingredients found. Add your first ingredient!"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <CreateIngredientForm
              onSubmit={handleCreateIngredient}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setEditingIngredient(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <EditIngredientForm
              ingredient={editingIngredient}
              onSubmit={(data) => handleUpdateIngredient(editingIngredient.id, data)}
              onCancel={() => setEditingIngredient(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Create Ingredient Form
function CreateIngredientForm({ onSubmit, onCancel }: {
  onSubmit: (data: CreateIngredientRequest) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateIngredientRequest>({
    name: "",
    category: "",
    allergen_tags: [],
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Auto-suggest allergens when name changes
    if (name === "name" && value) {
      const suggestions = getSuggestedAllergens(value);
      if (suggestions.length > 0) {
        setForm(prev => ({ ...prev, allergen_tags: suggestions }));
      }
    }
  };

  const toggleAllergen = (allergen: string) => {
    setForm(prev => ({
      ...prev,
      allergen_tags: prev.allergen_tags.includes(allergen)
        ? prev.allergen_tags.filter(a => a !== allergen)
        : [...prev.allergen_tags, allergen]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit({
      ...form,
      name: form.name.trim(),
      category: (form.category || "").trim() || undefined,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Add New Ingredient</h3>
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Salmon, Wheat Flour, Milk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Protein, Dairy, Grain"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Allergens</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {COMMON_ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  form.allergen_tags.includes(allergen)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{allergen}</span>
                </div>
              </button>
            ))}
          </div>
          
          {form.allergen_tags.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected allergens:</p>
              <div className="flex flex-wrap gap-1">
                {getAllergenChips(form.allergen_tags, currentLanguage as AllergenLanguage).map((allergen) => (
                  <span
                    key={allergen.name}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                  >
                    <span className="capitalize">{allergen.displayName}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Save Ingredient
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

// Edit Ingredient Form
function EditIngredientForm({ ingredient, onSubmit, onCancel }: {
  ingredient: Ingredient;
  onSubmit: (data: Partial<CreateIngredientRequest>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<CreateIngredientRequest>>({
    name: ingredient.name,
    category: typeof ingredient.category === 'string' ? ingredient.category : ingredient.category?.name,
    allergen_tags: ingredient.allergen_tags || [],
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleAllergen = (allergen: string) => {
    setForm(prev => ({
      ...prev,
      allergen_tags: (prev.allergen_tags || []).includes(allergen)
        ? (prev.allergen_tags || []).filter(a => a !== allergen)
        : [...(prev.allergen_tags || []), allergen]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit({
      ...form,
      name: form.name.trim(),
      category: form.category?.trim() || undefined,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Edit Ingredient: {ingredient.name}</h3>
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
              value={form.name || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Salmon, Wheat Flour, Milk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              name="category"
              value={form.category || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Protein, Dairy, Grain"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Allergens</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {COMMON_ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  (form.allergen_tags || []).includes(allergen)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{allergen}</span>
                </div>
              </button>
            ))}
          </div>
          
          {(form.allergen_tags || []).length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected allergens:</p>
              <div className="flex flex-wrap gap-1">
                {getAllergenChips(form.allergen_tags || [], currentLanguage as AllergenLanguage).map((allergen) => (
                  <span
                    key={allergen.name}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${allergen.color}`}
                  >
                    <span className="capitalize">{allergen.displayName}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Update Ingredient
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
import { useEffect, useState } from "react";
import { offlineManager } from "../utils/offlineManager";
import type {
  Ingredient,
  IngredientCategory,
  CreateIngredientRequest,
  CreateCategoryRequest,
} from "../types";

interface IngredientManagerProps {
  token: string;
}

export default function IngredientManager({ token }: IngredientManagerProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ingredients" | "categories">(
    "ingredients"
  );

  // Form states
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [editingCategory, setEditingCategory] =
    useState<IngredientCategory | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ingredientsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/ingredients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!ingredientsRes.ok || !categoriesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [ingredientsData, categoriesData] = await Promise.all([
        ingredientsRes.json(),
        categoriesRes.json(),
      ]);

      setIngredients(ingredientsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Filter ingredients based on search and category
  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Build ingredient hierarchy (parent -> children)
  const buildHierarchy = () => {
    const parentIngredients = filteredIngredients.filter(
      (ing) => !ing.parentId
    );
    const childIngredients = filteredIngredients.filter((ing) => ing.parentId);

    return parentIngredients.map((parent) => ({
      ...parent,
      children: childIngredients.filter(
        (child) => child.parentId === parent.id
      ),
    }));
  };

  const hierarchicalIngredients = buildHierarchy();

  const handleCreateIngredient = async (data: CreateIngredientRequest) => {
    try {
      const response = await fetch("/api/admin/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create ingredient");
      }

      const newIngredient = await response.json();
      setIngredients([...ingredients, newIngredient]);
      setShowIngredientForm(false);
      // Invalidate menu cache since ingredients affect dishes
      await offlineManager.invalidateMenuCache();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create ingredient"
      );
    }
  };

  const handleUpdateIngredient = async (
    id: string,
    data: Partial<CreateIngredientRequest>
  ) => {
    try {
      const response = await fetch(`/api/admin/ingredients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update ingredient");
      }

      const updatedIngredient = await response.json();
      setIngredients(
        ingredients.map((ing) => (ing.id === id ? updatedIngredient : ing))
      );
      setEditingIngredient(null);
      // Invalidate menu cache since ingredients affect dishes
      await offlineManager.invalidateMenuCache();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update ingredient"
      );
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;

    try {
      const response = await fetch(`/api/admin/ingredients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete ingredient");
      }

      setIngredients(ingredients.filter((ing) => ing.id !== id));
      // Invalidate menu cache since ingredients affect dishes
      await offlineManager.invalidateMenuCache();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete ingredient"
      );
    }
  };

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      setShowCategoryForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    }
  };

  const handleUpdateCategory = async (
    id: string,
    data: Partial<CreateCategoryRequest>
  ) => {
    try {
      console.log("Updating category:", id, "with data:", data);
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log("Update response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", errorText);
        throw new Error(`Failed to update category: ${response.status}`);
      }

      const updatedCategory = await response.json();
      console.log("Updated category received:", updatedCategory);
      setCategories(
        categories.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (err) {
      console.error("Update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      console.log("Deleting category:", id);
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Delete response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);
        throw new Error(errorData.error || "Failed to delete category");
      }

      console.log("Category deleted successfully");
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-green-600">
            🥄 Ingredient Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Manage ingredients and categories for your menu
          </p>
        </div>
      </header>

      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "ingredients"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                🥄 Ingredients ({ingredients.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "categories"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                📂 Categories ({categories.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "ingredients" && (
          <IngredientsTab
            ingredients={hierarchicalIngredients}
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showForm={showIngredientForm}
            setShowForm={setShowIngredientForm}
            editingItem={editingIngredient}
            setEditingItem={setEditingIngredient}
            onCreateIngredient={handleCreateIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            categories={categories}
            showForm={showCategoryForm}
            setShowForm={setShowCategoryForm}
            editingItem={editingCategory}
            setEditingItem={setEditingCategory}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </main>
    </div>
  );
}

// Ingredients Tab Component
function IngredientsTab({
  ingredients,
  categories,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showForm,
  setShowForm,
  editingItem,
  setEditingItem,
  onCreateIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}: any) {
  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All categories</option>
              {categories.map((cat: IngredientCategory) => (
                <option key={cat.id} value={cat.name.toLowerCase()}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Ingredient
          </button>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ingredients Hierarchy</h2>
          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No ingredients found
            </p>
          ) : (
            <div className="space-y-4">
              {ingredients.map((parent: any) => (
                <IngredientHierarchyItem
                  key={parent.id}
                  ingredient={parent}
                  categories={categories}
                  onEdit={setEditingItem}
                  onDelete={onDeleteIngredient}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowForm(false)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <IngredientForm
              categories={categories}
              allIngredients={ingredients}
              onSubmit={onCreateIngredient}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setEditingItem(null)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <IngredientForm
              categories={categories}
              allIngredients={ingredients}
              initialData={editingItem}
              onSubmit={(data: Partial<CreateIngredientRequest>) =>
                onUpdateIngredient(editingItem.id, data)
              }
              onCancel={() => setEditingItem(null)}
              isEditing
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Ingredient Hierarchy Item Component
function IngredientHierarchyItem({
  ingredient,
  categories,
  onEdit,
  onDelete,
}: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const category = categories.find(
    (cat: IngredientCategory) => cat.name.toLowerCase() === ingredient.category
  );

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          {ingredient.children?.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category?.icon || "🥄"}</span>
            <div>
              <h3 className="font-medium">{ingredient.name}</h3>
              <div className="flex gap-1 mt-1">
                {ingredient.allergen_tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(ingredient)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(ingredient.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && ingredient.children?.length > 0 && (
        <div className="p-4 pl-12 space-y-2">
          {ingredient.children.map((child: Ingredient) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">↳</span>
                <div>
                  <span className="font-medium">{child.name}</span>
                  <div className="flex gap-1 mt-1">
                    {child.allergen_tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(child)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(child.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ingredient Form Component
function IngredientForm({
  categories,
  allIngredients,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    parentId: initialData?.parentId || "",
    allergen_tags: initialData?.allergen_tags || [],
  });

  const [newAllergen, setNewAllergen] = useState("");

  const availableAllergens = [
    "milk",
    "eggs",
    "fish",
    "shellfish",
    "tree-nuts",
    "peanuts",
    "wheat",
    "gluten",
    "soy",
    "sesame",
    "celery",
    "mustard",
  ];

  const possibleParents = allIngredients.filter(
    (ing: any) => !ing.parentId && ing.id !== initialData?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addAllergen = () => {
    if (newAllergen && !formData.allergen_tags.includes(newAllergen)) {
      setFormData({
        ...formData,
        allergen_tags: [...formData.allergen_tags, newAllergen],
      });
      setNewAllergen("");
    }
  };

  const removeAllergen = (allergen: string) => {
    setFormData({
      ...formData,
      allergen_tags: formData.allergen_tags.filter(
        (tag: string) => tag !== allergen
      ),
    });
  };

  return (
    <div className="p-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="Enter ingredient name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              <option value="">Select category</option>
              {categories.map((cat: IngredientCategory) => (
                <option key={cat.id} value={cat.name.toLowerCase()}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent Ingredient (for hierarchy)
          </label>
          <select
            value={formData.parentId}
            onChange={(e) =>
              setFormData({ ...formData, parentId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            <option value="">None (top-level ingredient)</option>
            {possibleParents.map((parent: any) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allergen Tags
          </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select allergen</option>
                  {availableAllergens.map((allergen) => (
                    <option key={allergen} value={allergen}>
                      {allergen}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addAllergen}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergen_tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeAllergen(tag)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? "Update Ingredient" : "Create Ingredient"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Categories Tab Component (enhanced)
function CategoriesTab({
  categories,
  showForm,
  setShowForm,
  editingItem,
  setEditingItem,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ borderColor: category.color + "40" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium" style={{ color: category.color }}>
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.ingredientCount || 0} ingredients
                  </p>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
              )}

              {/* Show ingredients in this category */}
              {category.ingredients && category.ingredients.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Ingredients:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.ingredients.slice(0, 3).map((ingredient: any) => (
                      <span
                        key={ingredient.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {ingredient.name}
                      </span>
                    ))}
                    {category.ingredients.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{category.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    console.log("Edit button clicked for category:", category);
                    setEditingItem(category);
                  }}
                  className="flex-1 text-blue-600 hover:text-blue-800 text-sm py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    console.log(
                      "Delete button clicked for category:",
                      category.id
                    );
                    onDeleteCategory(category.id);
                  }}
                  className="flex-1 text-red-600 hover:text-red-800 text-sm py-1"
                  disabled={category.ingredientCount > 0}
                  title={
                    category.ingredientCount > 0
                      ? "Cannot delete category with ingredients"
                      : "Delete category"
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowForm(false)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <CategoryForm
              onSubmit={onCreateCategory}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit form */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setEditingItem(null)}
          />
          {/* Slide-up panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 max-h-[80vh] overflow-y-auto">
            <CategoryForm
              initialData={editingItem}
              onSubmit={(data: Partial<CreateCategoryRequest>) => {
                console.log("Form submitted with data:", data);
                onUpdateCategory(editingItem.id, data);
              }}
              onCancel={() => setEditingItem(null)}
              isEditing
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Category Form Component (enhanced)
function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    color: initialData?.color || "#3B82F6",
    icon: initialData?.icon || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const commonIcons = [
    "🥩",
    "🥛",
    "🌾",
    "🥬",
    "🍎",
    "🥜",
    "🌿",
    "🍯",
    "🧄",
    "🥄",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  required
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  placeholder="🥄"
                />
                <span className="text-sm text-gray-500">or choose:</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 border rounded text-xl hover:bg-gray-50 ${
                      formData.icon === icon
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

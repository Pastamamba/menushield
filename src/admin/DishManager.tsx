import { useState, useEffect } from "react";
import { useAdminDishes, useCreateDish, useUpdateDish, useDeleteDish } from "../utils/dishApi";
import { useAdminIngredients } from "../utils/ingredientApi";
import { useRestaurant } from "../utils/restaurantApi";
import { calculateAllergensFromIngredients, getAllergenChips } from "../utils/allergenCalculator";
import { formatPrice, getCurrencySymbol } from "../utils/currency";
import { useAdminTranslations } from "../hooks/useAdminTranslations";

import type { Dish, CreateDishRequest } from "../types";
import type { AllergenLanguage } from "../utils/allergenTranslations";

export default function DishManager() {
  const { currentLanguage } = useAdminTranslations();
  
  // Ensure currentLanguage is available before using it
  if (!currentLanguage) {
    return <div className="p-6">Loading...</div>;
  }
  
  const { data: dishes = [], isLoading, error } = useAdminDishes();
  const { data: availableIngredients = [] } = useAdminIngredients();
  const { data: restaurant } = useRestaurant();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Responsive view mode effect
  useEffect(() => {
    const handleResize = () => {
      // Auto-switch to grid view on mobile screens (< 768px)
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };

    // Check on mount
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when modals are open
  useEffect(() => {
    const isModalOpen = showCreateForm || editingDish;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateForm, editingDish]);

  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-xl p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dishes</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Advanced filtering and sorting
  const filteredAndSortedDishes = dishes
    .filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryName = (dish.category as any)?.name || dish.category || "Uncategorized";
      const matchesCategory = selectedCategory === "all" || categoryName === selectedCategory;
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && dish.is_active !== false) ||
                           (statusFilter === "inactive" && dish.is_active === false);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "price":
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case "category":
          aVal = ((a.category as any)?.name || a.category || "").toLowerCase();
          bVal = ((b.category as any)?.name || b.category || "").toLowerCase();
          break;
        case "ingredients":
          aVal = Array.isArray(a.ingredients) ? a.ingredients.length : 0;
          bVal = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalItems = filteredAndSortedDishes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDishes = filteredAndSortedDishes.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories
  const allCategories = ["all", ...Array.from(new Set(dishes.map(d => {
    return (d.category as any)?.name || d.category || "Uncategorized";
  })))];

  const getCategoryDisplayName = (dish: Dish) => {
    return (dish.category as any)?.name || dish.category || "Uncategorized";
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleCreateDish = async (dishData: CreateDishRequest) => {
    try {
      await createDishMutation.mutateAsync(dishData);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create dish:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create dish: ${errorMessage}`);
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
        dish: { is_active: !dish.is_active }
      });
    } catch (error) {
      console.error("Error toggling dish activation:", error);
      alert("Failed to update dish status. Please try again.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Professional Header */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dish Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your menu items ({filteredAndSortedDishes.length} of {dishes.length} dishes)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Add Dish
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters and Controls */}
      <div className="bg-white shadow-sm rounded-xl p-6 space-y-4">
        {/* Search and View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Hide toggle on mobile, show on desktop */}
            <button
              onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              className={`hidden md:flex items-center px-4 py-3 rounded-lg transition-colors border ${
                viewMode === "table" 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {viewMode === "table" ? "📊 Table" : "🔲 Grid"}
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories ({dishes.length})</option>
              {allCategories.slice(1).map(category => (
                <option key={category} value={category}>
                  {category} ({dishes.filter(d => ((d.category as any)?.name || d.category) === category).length})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="category">Category</option>
              <option value="ingredients">Ingredient Count</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Professional Table View - Desktop Only */}
      {viewMode === "table" && (
        <div className="hidden md:block bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Dish
                      {sortBy === "name" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center">
                      Category
                      {sortBy === "category" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      Price
                      {sortBy === "price" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("ingredients")}
                  >
                    <div className="flex items-center">
                      Ingredients
                      {sortBy === "ingredients" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDishes.map((dish, index) => (
                  <tr key={dish.id} className={`hover:bg-gray-50 transition-colors ${dish.is_active === false ? 'bg-gray-25 opacity-75' : ''} ${index % 2 === 0 ? '' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="flex items-center">
                          <h4 className={`text-sm font-semibold truncate ${dish.is_active === false ? 'text-gray-500' : 'text-gray-900'}`}>
                            {dish.name}
                          </h4>
                        </div>
                        {dish.description && (
                          <p className="text-sm text-gray-500 truncate mt-1 max-w-xs">
                            {dish.description}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {((dish.category as any)?.name || dish.category) && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {(dish.category as any)?.name || dish.category}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dish.price && (
                        <span className="text-lg font-semibold text-green-600">
                          {formatPrice(dish.price, restaurant?.currency || 'SEK')}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                              {dish.ingredients.slice(0, 4).map((ingredient) => (
                                <span
                                  key={ingredient}
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200 truncate max-w-[120px]"
                                  title={ingredient}
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                            {dish.ingredients.length > 4 && (
                              <div className="text-xs text-gray-500">
                                +{dish.ingredients.length - 4} more ingredients
                              </div>
                            )}
                            <div className="text-xs text-gray-400 pt-1">
                              Total: {dish.ingredients.length} ingredients
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No ingredients</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleActivation(dish)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            dish.is_active !== false ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              dish.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-3 text-sm font-medium ${
                          dish.is_active !== false ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {dish.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingDish(dish)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                          title="Edit dish"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete dish"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} dishes
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid View - Mobile First Design */}
      {viewMode === "grid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {paginatedDishes.map((dish) => (
              <div key={dish.id} className="bg-white shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100">
              {/* Card Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-gray-900 text-lg lg:text-xl line-clamp-2 mb-1" title={dish.name}>
                      {dish.name}
                    </h3>
                    {dish.description && (
                      <p className="text-sm lg:text-base text-gray-500 line-clamp-3 mb-3">
                        {dish.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActivation(dish)}
                    className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-colors shrink-0 min-w-[70px] ${
                      dish.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {dish.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
                
                {/* Price and Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-green-600 text-xl lg:text-2xl">
                    {formatPrice(dish.price || 0, restaurant?.currency || 'SEK')}
                  </span>
                  {((dish.category as any)?.name || dish.category) && (
                    <span className="px-3 py-1.5 bg-sage-50 text-sage-700 rounded-lg text-sm lg:text-base font-medium max-w-[140px] lg:max-w-none truncate" title={(dish.category as any)?.name || dish.category}>
                      {(dish.category as any)?.name || dish.category}
                    </span>
                  )}
                </div>

                {/* Ingredients */}
                <div className="mb-4">
                  {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs lg:text-sm font-medium text-gray-500 mb-2">
                        {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dish.ingredients.slice(0, 5).map((ingredient) => (
                          <span
                            key={ingredient}
                            className="inline-flex items-center px-2.5 py-1 text-xs lg:text-sm bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium"
                            title={ingredient}
                          >
                            {ingredient}
                          </span>
                        ))}
                        {dish.ingredients.length > 5 && (
                          <span className="text-xs lg:text-sm text-gray-500 px-2 py-1">
                            +{dish.ingredients.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No ingredients</span>
                  )}
                </div>

                {/* Allergens */}
                {Array.isArray(dish.allergen_tags) && dish.allergen_tags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Allergens</div>
                    <div className="flex flex-wrap gap-1">
                      {dish.allergen_tags.slice(0, 4).map((allergen) => (
                        <span
                          key={allergen}
                          className="inline-flex items-center px-1.5 py-0.5 text-xs lg:text-sm bg-red-50 text-red-700 rounded border border-red-200"
                        >
                          {allergen}
                        </span>
                      ))}
                      {dish.allergen_tags.length > 4 && (
                        <span className="text-xs text-gray-500 px-1">
                          +{dish.allergen_tags.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => setEditingDish(dish)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sage-600 hover:text-sage-700 hover:bg-sage-50 rounded-lg transition-colors font-medium text-sm lg:text-base"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm lg:text-base"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Grid Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Page {currentPage} of {totalPages}</span>
              <span className="text-gray-400">•</span>
              <span>{filteredAndSortedDishes.length} total dishes</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNumber > totalPages) return null;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNumber
                          ? "bg-green-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Empty State */}
      {filteredAndSortedDishes.length === 0 && (
        <div className="bg-white shadow-sm rounded-xl p-12 text-center">
          <div className="text-gray-400 text-8xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {dishes.length === 0 ? "No dishes yet" : "No dishes match your filters"}
          </h3>
          <p className="text-gray-600 mb-6">
            {dishes.length === 0 
              ? "Get started by adding your first dish to the menu." 
              : "Try adjusting your search criteria or filters."
            }
          </p>
          {dishes.length === 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Add Your First Dish
            </button>
          )}
        </div>
      )}

      {/* Modals */}
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

// Single page simplified dish creation modal
function CreateDishModal({ onSubmit, onCancel, availableIngredients, restaurant }: { 
  onSubmit: (data: CreateDishRequest) => void; 
  onCancel: () => void;
  availableIngredients: any[];
  restaurant?: any;
}) {
  const { t, currentLanguage } = useAdminTranslations();
  const lang = currentLanguage as AllergenLanguage;
  
  // Simplified ingredient categories - only show Base by default
  const [showOptionalCategories, setShowOptionalCategories] = useState(false);
  
  const [form, setForm] = useState<CreateDishRequest>({
    name: "",
    description: "",
    price: undefined as any, // Start with blank price
    category: "",
    ingredients: [],
    allergen_tags: [],
    is_modifiable: true,
    is_active: true,
    components: []
  });
  
  // Simplified ingredient tracking
  const [baseIngredients, setBaseIngredients] = useState<string[]>([]);
  const [sideIngredients, setSideIngredients] = useState<string[]>([]);
  const [sauceIngredients, setSauceIngredients] = useState<string[]>([]);
  const [toppingIngredients, setToppingIngredients] = useState<string[]>([]);
  
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value
      }));
    }
  };

  // Handle ingredient changes - update all ingredients and allergens
  const updateAllIngredients = () => {
    const allIngredients = [...baseIngredients, ...sideIngredients, ...sauceIngredients, ...toppingIngredients];
    const allergens = calculateAllergensFromIngredients(allIngredients, availableIngredients);
    
    // Create components for the dish
    const components: any[] = [];
    if (baseIngredients.length > 0) {
      components.push({
        name: 'Base',
        type: 'base' as const,
        ingredients: baseIngredients,
        allergen_tags: calculateAllergensFromIngredients(baseIngredients, availableIngredients),
        is_required: true,
        is_locked: true
      });
    }
    if (sideIngredients.length > 0) {
      components.push({
        name: 'Side Dish',
        type: 'side' as const,
        ingredients: sideIngredients,
        allergen_tags: calculateAllergensFromIngredients(sideIngredients, availableIngredients),
        is_required: false,
        is_locked: false
      });
    }
    if (sauceIngredients.length > 0) {
      components.push({
        name: 'Sauce/Dip',
        type: 'sauce' as const,
        ingredients: sauceIngredients,
        allergen_tags: calculateAllergensFromIngredients(sauceIngredients, availableIngredients),
        is_required: false,
        is_locked: false
      });
    }
    if (toppingIngredients.length > 0) {
      components.push({
        name: 'Topping/Garnish',
        type: 'garnish' as const,
        ingredients: toppingIngredients,
        allergen_tags: calculateAllergensFromIngredients(toppingIngredients, availableIngredients),
        is_required: false,
        is_locked: false
      });
    }
    
    setForm(prev => ({ 
      ...prev, 
      ingredients: allIngredients,
      allergen_tags: allergens,
      components: components
    }));
  };

  // Update ingredients whenever any category changes
  useEffect(() => {
    updateAllIngredients();
  }, [baseIngredients, sideIngredients, sauceIngredients, toppingIngredients, availableIngredients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Dish name is required");
      return;
    }
    if (baseIngredients.length === 0) {
      setError("At least one base ingredient is required");
      return;
    }
    setError("");
    
    try {
      // Ensure ingredients and components are up to date before submission
      updateAllIngredients();
      
      // Wait a tick to ensure state is updated, then submit
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const submitData = {
        ...form,
        price: form.price || 0 // Convert undefined to 0 for backend
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save dish');
    }
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
        <div className="bg-gradient-to-r from-sage-600 to-sage-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Create New Dish</h2>
              <p className="text-sage-100 text-sm">Add a new dish to your menu</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-sage-100 transition-colors p-1"
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
          <form id="create-dish-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
                  placeholder="Enter dish name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select a category</option>
                  <option value="Appetizer">Appetizer</option>
                  <option value="Main Course">{t('mainCourse')}</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Salad">Salad</option>
                  <option value="Soup">Soup</option>
                  <option value="Side Dish">{t('sideDish')}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
                placeholder="Describe the dish"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ({getCurrencySymbol(restaurant?.currency || 'SEK')}) <span className="text-gray-500 text-xs">- optional</span>
              </label>
              <input 
                name="price" 
                type="number" 
                step="0.01"
                value={form.price} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
                placeholder="Leave blank to hide price"
              />
            </div>

            {/* Ingredient Sections */}
            <div className="space-y-6">
              {/* Base Ingredients (Required) */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍽️</span>
                  <h4 className="font-medium text-gray-900">Base Ingredients</h4>
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
                    Required
                  </span>
                </div>
                <IngredientSelector 
                  selectedIngredients={baseIngredients}
                  availableIngredients={availableIngredients}
                  onChange={setBaseIngredients}
                  placeholder="Select base ingredients (required)..."
                />
                {baseIngredients.length === 0 && (
                  <div className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Base ingredients are required
                  </div>
                )}
              </div>

              {/* Optional Categories */}
              {!showOptionalCategories && (
                <button
                  type="button"
                  onClick={() => setShowOptionalCategories(true)}
                  className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors text-sm"
                >
                  + Add optional ingredients (sides, sauces, toppings)
                </button>
              )}

              {showOptionalCategories && (
                <>
                  {/* Side Dish */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🥗</span>
                      <h4 className="font-medium text-gray-900">Side Dish</h4>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                        Optional
                      </span>
                    </div>
                    <IngredientSelector 
                      selectedIngredients={sideIngredients}
                      availableIngredients={availableIngredients}
                      onChange={setSideIngredients}
                      placeholder="Select side ingredients..."
                    />
                  </div>

                  {/* Sauce/Dip */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🫙</span>
                      <h4 className="font-medium text-gray-900">Sauce/Dip</h4>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                        Optional
                      </span>
                    </div>
                    <IngredientSelector 
                      selectedIngredients={sauceIngredients}
                      availableIngredients={availableIngredients}
                      onChange={setSauceIngredients}
                      placeholder="Select sauce ingredients..."
                    />
                  </div>

                  {/* Topping/Garnish */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🌿</span>
                      <h4 className="font-medium text-gray-900">Topping/Garnish</h4>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                        Optional
                      </span>
                    </div>
                    <IngredientSelector 
                      selectedIngredients={toppingIngredients}
                      availableIngredients={availableIngredients}
                      onChange={setToppingIngredients}
                      placeholder="Select topping ingredients..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Summary and Allergens */}
            {form.ingredients.length > 0 && (
              <>
                {/* Ingredient Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                    <span className="mr-1">📊</span>
                    Ingredient Summary ({form.ingredients.length} total)
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs border">
                      🍽️ Base: {baseIngredients.length}
                    </span>
                    {sideIngredients.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs border">
                        🥗 Side: {sideIngredients.length}
                      </span>
                    )}
                    {sauceIngredients.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs border">
                        🫙 Sauce: {sauceIngredients.length}
                      </span>
                    )}
                    {toppingIngredients.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs border">
                        🌿 Topping: {toppingIngredients.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-calculated Allergens */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    Detected Allergens
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Auto-calculated
                    </span>
                  </h4>
                  
                  <div className="min-h-[2rem] p-2 border border-orange-200 rounded-lg bg-white">
                    {form.allergen_tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {getAllergenChips(form.allergen_tags, lang).map((allergen) => (
                          <span
                            key={allergen.name}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${allergen.color}`}
                          >
                            <span className="capitalize">{allergen.displayName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-600 font-medium text-sm text-center py-1">No allergens detected</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-dish-form"
            className="px-8 py-3 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors font-medium flex items-center shadow-sm"
            disabled={baseIngredients.length === 0}
          >
            <span className="mr-2">✨</span>
            Create Dish
          </button>
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
  const { t, currentLanguage } = useAdminTranslations();
  const lang = currentLanguage as AllergenLanguage;
  
  const [form, setForm] = useState<Partial<CreateDishRequest>>({
    name: dish.name,
    description: dish.description,
    price: dish.price || undefined,
    category: typeof dish.category === 'string' ? dish.category : (dish.category as any)?.name || '',
    ingredients: dish.ingredients,
    allergen_tags: dish.allergen_tags,
    is_modifiable: dish.is_modifiable,
  });
  const [error, setError] = useState("");

  // Debug logging


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setForm(prev => {
      const newForm = {
        ...prev,
        [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value
      };
      console.log('🔍 EditDishModal form updated:', newForm);
      return newForm;
    });
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
    console.log('🔍 EditDishForm submitting form data:', JSON.stringify(form, null, 2));
    console.log('🔍 EditDishForm ingredients specifically:', form.ingredients);
    console.log('🔍 EditDishForm allergen_tags specifically:', form.allergen_tags);
    onSubmit(form);
  };

  return (
    <div className="max-h-[90vh] overflow-hidden">
      {/* Professional Header - Same style as CreateDishModal */}
      <div className="bg-gradient-to-r from-sage-600 to-sage-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Dish</h2>
            <p className="text-sage-100 text-sm">{dish.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-sage-100 transition-colors p-1"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
              placeholder="Enter dish name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={form.category ?? ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors"
            >
              <option value="">Select a category</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Main Course">{t('mainCourse')}</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Salad">Salad</option>
              <option value="Soup">Soup</option>
              <option value="Side Dish">{t('sideDish')}</option>
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
            placeholder="Describe the dish"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price ({getCurrencySymbol(restaurant?.currency || 'SEK')}) <span className="text-gray-500 text-xs">- optional</span>
          </label>
          <input 
            name="price" 
            type="number" 
            step="0.01"
            value={form.price || ''} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors" 
            placeholder="Leave blank to hide price"
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
                {getAllergenChips(form.allergen_tags, lang).map((allergen) => (
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
          className="px-6 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors font-medium"
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



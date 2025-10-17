import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useRestaurant } from "../contexts/RestaurantContext";
import { useLanguage } from "../contexts/LanguageContext";
import { queryKeys } from "./queryClient";
import logger from "./logger";
import type { Dish, CreateDishRequest } from "../types";

// API base URL (same as ingredientApi)
const API_BASE = import.meta.env.VITE_API_URL || 'https://menushield-production.up.railway.app';

// Helper function for API URLs
const getApiUrl = (path: string) => API_BASE ? `${API_BASE}${path}` : path;

// Background prefetch helper for menu data
export const prefetchMenuData = (queryClient: any, restaurantSlug: string, language = 'en') => {
  return queryClient.prefetchQuery({
    queryKey: [...queryKeys.dishes, restaurantSlug, language],
    queryFn: () => api.getMenuBySlug(restaurantSlug, language),
    staleTime: 1000 * 60 * 5, // 5 minutes for background refresh
  });
};

// API functions
const api = {
  // Guest menu by restaurant slug
  getMenuBySlug: async (slug: string, language = 'en'): Promise<Dish[]> => {
    // Using Vite proxy now
    const url = `/api/menu/by-slug/${slug}?lang=${language}`;
    console.log('🔍 PROXY MENU URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.status}`);
    }
    const data = await response.json();
    
    // Force allergen_tags to be arrays for all dishes
    return data.map((dish: any) => ({
      ...dish,
      allergen_tags: Array.isArray(dish.allergen_tags) 
        ? dish.allergen_tags 
        : dish.allergen_tags 
          ? [dish.allergen_tags].flat()
          : [],
      components: Array.isArray(dish.components) 
        ? dish.components 
        : [],
      ingredients: Array.isArray(dish.ingredients) 
        ? dish.ingredients 
        : []
    }));
  },

  // Legacy guest menu (fallback)
  getMenu: async (language = 'en'): Promise<Dish[]> => {
    const response = await fetch(getApiUrl(`/api/menu?lang=${language}`));
    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.status}`);
    }
    const data = await response.json();
    
    // Force allergen_tags to be arrays for all dishes
    return data.map((dish: any) => ({
      ...dish,
      allergen_tags: Array.isArray(dish.allergen_tags) 
        ? dish.allergen_tags 
        : dish.allergen_tags 
          ? [dish.allergen_tags].flat()
          : [],
      components: Array.isArray(dish.components) 
        ? dish.components 
        : [],
      ingredients: Array.isArray(dish.ingredients) 
        ? dish.ingredients 
        : []
    }));
  },

  // Admin dishes
  getAdminDishes: async (token: string, language = 'en'): Promise<Dish[]> => {
    try {
      const response = await fetch(`/api/admin/menu?lang=${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admin dishes: ${response.status}`);
      }
      
      const data = await response.json();
      
      logger.debug('Raw admin dishes data from API:', data);
      
      // Force allergen_tags to be arrays for all dishes
      const processedData = data.map((dish: any) => ({
        ...dish,
        allergen_tags: Array.isArray(dish.allergen_tags) 
          ? dish.allergen_tags 
          : dish.allergen_tags 
            ? [dish.allergen_tags].flat()
            : [],
        components: Array.isArray(dish.components) 
          ? dish.components 
          : [],
        ingredients: Array.isArray(dish.ingredients) 
          ? dish.ingredients 
          : []
      }));
      
      // Merge with local dishes
      const localDishes = JSON.parse(localStorage.getItem('localDishes') || '[]');
      const mergedData = [...processedData, ...localDishes];
      
      logger.debug('Processed admin dishes data (with local):', mergedData);
      return mergedData;
    } catch (error) {
      logger.debug('Backend failed, using only local dishes:', error);
      
      // Fallback to only local dishes if backend fails
      const localDishes = JSON.parse(localStorage.getItem('localDishes') || '[]');
      logger.debug('Local dishes only:', localDishes);
      return localDishes;
    }
  },

  // Create dish
  createDish: async (dish: CreateDishRequest, token: string): Promise<Dish> => {
    console.log('🍽️ Creating dish with data:', dish);
    console.log('🔑 Using token:', token ? 'Token present' : 'No token');
    
    // Create a clean payload that matches backend expectations
    const payload = {
      name: dish.name,
      description: dish.description || "",
      price: dish.price || 0,
      category: dish.category || "",
      ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
      allergen_tags: Array.isArray(dish.allergen_tags) ? dish.allergen_tags : [],
      modification_note: dish.modification_note || null,
      is_modifiable: Boolean(dish.is_modifiable),
      is_active: dish.is_active !== undefined ? Boolean(dish.is_active) : true,
      components: Array.isArray(dish.components) ? dish.components : []
    };
    
    console.log('📤 Clean payload being sent:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📡 Create dish response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `Failed to create dish: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('🚨 Error response data:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.log('🚨 Could not parse error response as JSON');
          const textError = await response.text();
          console.log('🚨 Error response text:', textError);
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ Create dish success:', result);
      return result;
    } catch (error) {
      console.log('🚨 Backend create failed, falling back to local mock:', error);
      
      // Fallback: Create mock dish and store locally
      const mockDish: Dish = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        restaurantId: "local", // For local dishes
        name: dish.name,
        description: dish.description || "",
        price: dish.price || 0,
        category: dish.category || "",
        ingredients: dish.ingredients || [],
        allergen_tags: dish.allergen_tags || [],
        modification_note: dish.modification_note || null,
        is_modifiable: dish.is_modifiable || false,
        is_active: dish.is_active !== undefined ? dish.is_active : true,
        components: (dish.components || []).map((comp, index) => ({
          ...comp,
          id: `comp-${Date.now()}-${index}`
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store in localStorage for persistence
      const existingDishes = JSON.parse(localStorage.getItem('localDishes') || '[]');
      existingDishes.push(mockDish);
      localStorage.setItem('localDishes', JSON.stringify(existingDishes));
      
      console.log('💾 Dish saved locally:', mockDish);
      return mockDish;
    }
  },

  // Update dish
  updateDish: async (
    id: string,
    dish: Partial<CreateDishRequest>,
    token: string
  ): Promise<Dish> => {
    const response = await fetch(`/api/admin/menu/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dish),
    });
    if (!response.ok) {
      throw new Error(`Failed to update dish: ${response.status}`);
    }
    return response.json();
  },

  // Delete dish
  deleteDish: async (id: string, token: string): Promise<void> => {
    const response = await fetch(`/api/admin/menu/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete dish: ${response.status}`);
    }
  },
};

// Hooks
export const useMenu = () => {
  const { restaurantSlug } = useRestaurant();
  const { currentLanguage } = useLanguage();

  logger.debug('useMenu hook - restaurantSlug:', restaurantSlug, 'language:', currentLanguage);

  return useQuery({
    queryKey: [...queryKeys.dishes, restaurantSlug, currentLanguage],
    queryFn: () => {
      logger.debug('useMenu queryFn - fetching for slug:', restaurantSlug, 'language:', currentLanguage);
      if (restaurantSlug) {
        return api.getMenuBySlug(restaurantSlug, currentLanguage);
      }
      // Fallback to legacy API
      logger.debug('useMenu queryFn - using legacy API');
      return api.getMenu(currentLanguage);
    },
    enabled: !!restaurantSlug, // Only run when we have a restaurant slug
    staleTime: 1000 * 60 * 10, // 10 minutes (was 5) - reduce API calls
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data on component mount
    retry: 1, // Only retry once to prevent infinite loops
    retryDelay: 2000, // Fixed 2 second delay instead of exponential backoff
  });
};

export const useAdminDishes = () => {
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();

  return useQuery({
    queryKey: [...queryKeys.adminDishes, currentLanguage],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return api.getAdminDishes(token, currentLanguage);
    },
    enabled: !!token, // Only run query if token exists
    staleTime: 1000 * 60 * 5, // 5 minutes (admin data changes more frequently)
    gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
    refetchOnWindowFocus: false, // Reduce API calls for admin interface
    retry: 2, // Fewer retries for admin (faster failure feedback)
  });
};

export const useCreateDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useRestaurant();
  const { currentLanguage } = useLanguage();

  return useMutation({
    mutationFn: (dish: CreateDishRequest) => {
      if (!token) throw new Error("No authentication token");
      return api.createDish(dish, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: [...queryKeys.adminDishes, currentLanguage] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug, currentLanguage] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug, currentLanguage);
      }
    },
  });
};

export const useUpdateDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useRestaurant();
  const { currentLanguage } = useLanguage();

  return useMutation({
    mutationFn: ({
      id,
      dish,
    }: {
      id: string;
      dish: Partial<CreateDishRequest>;
    }) => {
      if (!token) throw new Error("No authentication token");
      return api.updateDish(id, dish, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: [...queryKeys.adminDishes, currentLanguage] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug, currentLanguage] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug, currentLanguage);
      }
    },
  });
};

export const useDeleteDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useRestaurant();
  const { currentLanguage } = useLanguage();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("No authentication token");
      return api.deleteDish(id, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: [...queryKeys.adminDishes, currentLanguage] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug, currentLanguage] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug, currentLanguage);
      }
    },
  });
};

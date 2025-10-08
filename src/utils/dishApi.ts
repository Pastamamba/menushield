import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useRestaurant } from "../contexts/RestaurantContext";
import { queryKeys } from "./queryClient";
import type { Dish, CreateDishRequest } from "../types";

// Background prefetch helper for menu data
export const prefetchMenuData = (queryClient: any, restaurantSlug: string) => {
  return queryClient.prefetchQuery({
    queryKey: [...queryKeys.dishes, restaurantSlug],
    queryFn: () => api.getMenuBySlug(restaurantSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes for background refresh
  });
};

// API functions
const api = {
  // Guest menu by restaurant slug
  getMenuBySlug: async (slug: string): Promise<Dish[]> => {
    const response = await fetch(`/api/menu/by-slug/${slug}`);
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
  getMenu: async (): Promise<Dish[]> => {
    const response = await fetch("/api/menu");
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
  getAdminDishes: async (token: string): Promise<Dish[]> => {
    const response = await fetch("/api/admin/menu", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch admin dishes: ${response.status}`);
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

  // Create dish
  createDish: async (dish: CreateDishRequest, token: string): Promise<Dish> => {
    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dish),
    });
    if (!response.ok) {
      throw new Error(`Failed to create dish: ${response.status}`);
    }
    return response.json();
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

  return useQuery({
    queryKey: [...queryKeys.dishes, restaurantSlug],
    queryFn: () => {
      if (restaurantSlug) {
        return api.getMenuBySlug(restaurantSlug);
      }
      // Fallback to legacy API
      return api.getMenu();
    },
    enabled: !!restaurantSlug, // Only run if we have a restaurant slug
    staleTime: 1000 * 60 * 10, // 10 minutes (was 5) - reduce API calls
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data on component mount
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useAdminDishes = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.adminDishes,
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return api.getAdminDishes(token);
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

  return useMutation({
    mutationFn: (dish: CreateDishRequest) => {
      if (!token) throw new Error("No authentication token");
      return api.createDish(dish, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDishes });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug);
      }
    },
  });
};

export const useUpdateDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useRestaurant();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDishes });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug);
      }
    },
  });
};

export const useDeleteDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useRestaurant();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("No authentication token");
      return api.deleteDish(id, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDishes });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.dishes, restaurantSlug] });
      
      // Background prefetch updated menu data
      if (restaurantSlug) {
        prefetchMenuData(queryClient, restaurantSlug);
      }
    },
  });
};

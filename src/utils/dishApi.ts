import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "./queryClient";
import type { Dish, CreateDishRequest } from "../types";

// API functions
const api = {
  // Guest menu
  getMenu: async (): Promise<Dish[]> => {
    const response = await fetch("/api/menu");
    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.status}`);
    }
    return response.json();
  },

  // Admin dishes
  getAdminDishes: async (token: string): Promise<Dish[]> => {
    const response = await fetch("/api/admin/menu", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch admin dishes: ${response.status}`);
    }
    return response.json();
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
  return useQuery({
    queryKey: queryKeys.dishes,
    queryFn: api.getMenu,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes (admin data changes more frequently)
  });
};

export const useCreateDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dish: CreateDishRequest) => {
      if (!token) throw new Error("No authentication token");
      return api.createDish(dish, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDishes });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes });
    },
  });
};

export const useUpdateDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes });
    },
  });
};

export const useDeleteDish = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("No authentication token");
      return api.deleteDish(id, token);
    },
    onSuccess: () => {
      // Invalidate and refetch dishes
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDishes });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes });
    },
  });
};

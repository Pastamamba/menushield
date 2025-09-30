import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest, IngredientCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

// API base URL (same as dishApi)
const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper function for API URLs
const getApiUrl = (path: string) => API_BASE ? `${API_BASE}${path}` : path;

// Ingredients API functions
async function fetchIngredients(): Promise<Ingredient[]> {
  const response = await fetch(getApiUrl('/api/admin/ingredients'), {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ingredients: ${response.statusText}`);
  }
  
  return response.json();
}

async function createIngredient(data: CreateIngredientRequest): Promise<Ingredient> {
  const response = await fetch(getApiUrl('/api/admin/ingredients'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create ingredient: ${response.statusText}`);
  }
  
  return response.json();
}

async function updateIngredient(id: string, data: Partial<UpdateIngredientRequest>): Promise<Ingredient> {
  const response = await fetch(getApiUrl(`/api/admin/ingredients/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update ingredient: ${response.statusText}`);
  }
  
  return response.json();
}

async function deleteIngredient(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/admin/ingredients/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete ingredient: ${response.statusText}`);
  }
}

// Categories API functions
async function fetchCategories(): Promise<IngredientCategory[]> {
  const response = await fetch(getApiUrl('/api/admin/categories'), {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  
  return response.json();
}

async function createCategory(data: CreateCategoryRequest): Promise<IngredientCategory> {
  const response = await fetch(getApiUrl('/api/admin/categories'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`);
  }
  
  return response.json();
}

async function updateCategory(id: string, data: Partial<UpdateCategoryRequest>): Promise<IngredientCategory> {
  const response = await fetch(getApiUrl(`/api/admin/categories/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.statusText}`);
  }
  
  return response.json();
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/admin/categories/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.statusText}`);
  }
}

// React Query hooks for ingredients
export function useAdminIngredients() {
  return useQuery({
    queryKey: ['admin', 'ingredients'],
    queryFn: fetchIngredients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateIngredientRequest> }) =>
      updateIngredient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] });
    },
  });
}

// React Query hooks for categories
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateCategoryRequest> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}
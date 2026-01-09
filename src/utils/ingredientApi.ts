import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import logger from './logger';
import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest, IngredientCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

// API base URL (same as dishApi)
const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper function for API URLs
const getApiUrl = (path: string) => API_BASE ? `${API_BASE}${path}` : path;

// Ingredients API functions
async function fetchIngredients(token: string, language = 'en'): Promise<Ingredient[]> {
  const headers = { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await fetch(`/api/admin/ingredients?lang=${language}`, {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 fetchIngredients - error response:', errorText);
      console.error('🔍 fetchIngredients - full response object:', response);
      throw new Error(`Failed to fetch ingredients: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('🔍 fetchIngredients - network error:', error);
    throw error;
  }
}

async function createIngredient(data: CreateIngredientRequest, token: string): Promise<Ingredient> {
  const response = await fetch('/api/admin/ingredients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create ingredient: ${response.statusText}`);
  }
  
  return response.json();
}

async function updateIngredient(id: string, data: Partial<UpdateIngredientRequest>, token: string): Promise<Ingredient> {
  const response = await fetch(`/api/admin/ingredients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update ingredient: ${response.statusText}`);
  }
  
  return response.json();
}

async function deleteIngredient(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/ingredients/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete ingredient: ${response.statusText}`);
  }
}

// Categories API functions
async function fetchCategories(token: string): Promise<IngredientCategory[]> {
  const response = await fetch('/api/admin/categories', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  
  const data = await response.json();
  logger.debug('Raw categories data from API:', data);
  
  // Ensure data is properly structured
  const processedData = Array.isArray(data) ? data.map(category => ({
    ...category,
    // Ensure all required fields exist
    id: category.id,
    name: category.name || '',
    description: category.description || '',
    color: category.color || '#3B82F6',
    icon: category.icon || '🥄',
  })) : [];
  
  logger.debug('Processed categories data:', processedData);
  return processedData;
}

async function createCategory(data: CreateCategoryRequest, token: string): Promise<IngredientCategory> {
  const response = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`);
  }
  
  return response.json();
}

async function updateCategory(id: string, data: Partial<UpdateCategoryRequest>, token: string): Promise<IngredientCategory> {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.statusText}`);
  }
  
  return response.json();
}

async function deleteCategory(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.statusText}`);
  }
}

// React Query hooks for ingredients
export function useAdminIngredients() {
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();
  
  return useQuery({
    queryKey: ['admin', 'ingredients', currentLanguage],
    queryFn: () => {
      if (!token) throw new Error('No authentication token');
      return fetchIngredients(token, currentLanguage);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!token,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();
  
  return useMutation({
    mutationFn: (data: CreateIngredientRequest) => {
      if (!token) throw new Error('No authentication token');
      return createIngredient(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients', currentLanguage] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateIngredientRequest> }) => {
      if (!token) throw new Error('No authentication token');
      return updateIngredient(id, data, token);
    },
    onSuccess: () => {
      // Always invalidate cache to fetch fresh data from database
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients', currentLanguage] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { currentLanguage } = useLanguage();
  
  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('No authentication token');
      return deleteIngredient(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients', currentLanguage] });
    },
  });
}

// React Query hooks for categories
export function useAdminCategories() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => {
      if (!token) throw new Error('No authentication token');
      return fetchCategories(token);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!token,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => {
      if (!token) throw new Error('No authentication token');
      return createCategory(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateCategoryRequest> }) => {
      if (!token) throw new Error('No authentication token');
      return updateCategory(id, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('No authentication token');
      return deleteCategory(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}
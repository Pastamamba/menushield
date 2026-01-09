import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurant as useRestaurantContext } from '../contexts/RestaurantContext';
import type { Restaurant } from '../types';

interface UpdateRestaurantRequest {
  name?: string;
  description?: string;
  contact?: string;
  showPrices?: boolean;
  currency?: string;
  defaultLanguage?: string;
  supportedLanguages?: string;
}

// Fetch restaurant info (uses context)
export const useRestaurant = () => {
  const { restaurant, isLoading, error } = useRestaurantContext();
  
  return {
    data: restaurant,
    isLoading,
    error,
    isSuccess: !isLoading && !error,
    isError: !!error
  };
};

// Update restaurant settings (admin only)
export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  const { refreshRestaurant } = useRestaurantContext();
  
  return useMutation({
    mutationFn: async (data: UpdateRestaurantRequest): Promise<Restaurant> => {
      const token = localStorage.getItem('authToken'); // Use correct token key
      const response = await fetch(`/api/admin/restaurant`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update restaurant');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Refresh the restaurant context to get updated data
      await refreshRestaurant();
      // Also invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
};
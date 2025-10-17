import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Fetch restaurant info (public)
export const useRestaurant = () => {
  return useQuery({
    queryKey: ['restaurant'],
    queryFn: async (): Promise<Restaurant> => {
      const response = await fetch(`/api/restaurant`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant info');
      }
      return response.json();
    },
  });
};

// Update restaurant settings (admin only)
export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateRestaurantRequest): Promise<Restaurant> => {
      const token = localStorage.getItem('token');
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
    onSuccess: () => {
      // Invalidate and refetch restaurant data
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
};
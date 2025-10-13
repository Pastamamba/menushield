import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { prefetchMenuData } from '../utils/dishApi';
import { queryClient } from '../utils/queryClient';
import logger from '../utils/logger';
import type { Restaurant } from '../types';

interface RestaurantContextType {
  restaurant: Restaurant | null;
  restaurantSlug: string | null;
  isLoading: boolean;
  error: string | null;
  switchRestaurant: (slug: string) => void;
  refreshRestaurant: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
}

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  logger.debug('RestaurantProvider - useParams result:', { restaurantSlug });
  logger.debug('RestaurantProvider - current location:', window.location.pathname);

  const fetchRestaurantBySlug = async (slug: string): Promise<Restaurant | null> => {
    try {
      const response = await fetch(`/api/restaurants/slug/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Restaurant "${slug}" not found`);
        }
        throw new Error('Error loading restaurant');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Error fetching restaurant by slug:', err);
      throw err;
    }
  };

  const loadRestaurant = async (slug: string) => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const restaurantData = await fetchRestaurantBySlug(slug);
      setRestaurant(restaurantData);
      
      // Background prefetch menu data for better performance
      setTimeout(() => {
        prefetchMenuData(queryClient, slug).catch((err: any) => 
          console.warn('Background menu prefetch failed:', err)
        );
      }, 100); // Small delay to not block restaurant loading
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tuntematon virhe';
      setError(errorMessage);
      setRestaurant(null);
      
      // Redirect to default restaurant if slug not found
      if (errorMessage.includes('not found')) {
        navigate('/r/demo-restaurant', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchRestaurant = (slug: string) => {
    navigate(`/r/${slug}`);
  };

  const refreshRestaurant = async () => {
    if (restaurantSlug) {
      await loadRestaurant(restaurantSlug);
    }
  };

  useEffect(() => {
    if (restaurantSlug) {
      loadRestaurant(restaurantSlug);
    } else {
      setIsLoading(false);
      setRestaurant(null);
    }
  }, [restaurantSlug]);

  const value: RestaurantContextType = {
    restaurant,
    restaurantSlug: restaurantSlug || null,
    isLoading,
    error,
    switchRestaurant,
    refreshRestaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}

// Hook for getting restaurant URL structure
export function useRestaurantUrl() {
  const { restaurantSlug } = useRestaurant();
  
  return {
    menuUrl: restaurantSlug ? `/r/${restaurantSlug}` : '/r/demo-restaurant',
    adminUrl: restaurantSlug ? `/r/${restaurantSlug}/admin` : '/admin',
    qrCodeUrl: restaurantSlug ? `${window.location.origin}/r/${restaurantSlug}` : `${window.location.origin}/r/demo-restaurant`,
    shortUrl: restaurantSlug ? `/r/${restaurantSlug}` : '/r/demo-restaurant',
  };
}
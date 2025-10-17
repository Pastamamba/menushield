import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { prefetchMenuData } from '../utils/dishApi';
import { queryClient } from '../utils/queryClient';
import logger from '../utils/logger';
import type { Restaurant } from '../types';

// API base URL (same as other API utils)
const API_BASE = import.meta.env.VITE_API_URL || 'https://menushield-production.up.railway.app';

// Helper function for API URLs
const getApiUrl = (path: string) => API_BASE ? `${API_BASE}${path}` : path;

// Debug log for development
if (import.meta.env.DEV) {
  console.log('RestaurantContext - API_BASE:', API_BASE);
  console.log('RestaurantContext - VITE_API_URL:', import.meta.env.VITE_API_URL);
}

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
      // Using Vite proxy now
      const url = `/api/restaurants/slug/${slug}`;
      console.log('🔍 PROXY URL:', url);
      const response = await fetch(url);
      
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
      
      // Background prefetch disabled in development to prevent loops
      // setTimeout(() => {
      //   prefetchMenuData(queryClient, slug).catch((err: any) => 
      //     console.warn('Background menu prefetch failed:', err)
      //   );
      // }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tuntematon virhe';
      setError(errorMessage);
      setRestaurant(null);
      
      // Don't redirect if we're already on demo-restaurant - prevents infinite loop
      if (errorMessage.includes('not found') && slug !== 'demo-restaurant') {
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
    logger.debug('RestaurantContext useEffect triggered - restaurantSlug:', restaurantSlug);
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
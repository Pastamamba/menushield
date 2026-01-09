import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logger from '../utils/logger';
import type { Restaurant } from '../types';
import { useAuth } from '../auth/AuthContext';

// API base URL (same as other API utils)
const API_BASE = import.meta.env.VITE_API_URL || 'https://menushield-production.up.railway.app';


// Debug log for development
if (import.meta.env.DEV) {

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
  const { user, token } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  logger.debug('RestaurantProvider - useParams result:', { restaurantSlug });
  logger.debug('RestaurantProvider - current location:', window.location.pathname);
  logger.debug('RestaurantProvider - user from auth:', user);

  const fetchRestaurantBySlug = async (slug: string): Promise<Restaurant | null> => {
    try {
      // Using Vite proxy now
      const url = `/api/restaurants/slug/${slug}`;

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

  const fetchRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    try {
      const url = `/api/restaurants/${restaurantId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Restaurant with ID "${restaurantId}" not found`);
        }
        throw new Error('Error loading restaurant');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Error fetching restaurant by ID:', err);
      throw err;
    }
  };

  const loadRestaurant = async (slug?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let restaurantData: Restaurant | null = null;
      
      if (slug) {
        // Load by slug from URL parameter
        restaurantData = await fetchRestaurantBySlug(slug);
      } else if (user?.restaurantId) {
        // Load by restaurantId from JWT token (for legacy /admin routes)
        restaurantData = await fetchRestaurantById(user.restaurantId);
      } else if (token) {
        // Parse token directly if user data not available yet
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.restaurantId) {
            restaurantData = await fetchRestaurantById(payload.restaurantId);
          }
        } catch (parseError) {
          console.warn('Failed to parse JWT token:', parseError);
        }
      }
      
      if (restaurantData) {
        setRestaurant(restaurantData);
      } else {
        // No restaurant data available - redirect to demo

        if (window.location.pathname !== '/r/demo-restaurant') {
          navigate('/r/demo-restaurant', { replace: true });
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setRestaurant(null);
      
      // Don't redirect if we're already on demo-restaurant - prevents infinite loop
      if (errorMessage.includes('not found') && window.location.pathname !== '/r/demo-restaurant') {
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
    logger.debug('RestaurantContext useEffect triggered', { restaurantSlug, user, token });
    
    if (restaurantSlug) {
      // URL-based restaurant loading (public routes)
      loadRestaurant(restaurantSlug);
    } else if (user?.restaurantId || token) {
      // JWT-based restaurant loading (legacy admin routes)
      loadRestaurant();
    } else {
      // No restaurant info available
      setIsLoading(false);
      setRestaurant(null);
    }
  }, [restaurantSlug, user, token]);

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
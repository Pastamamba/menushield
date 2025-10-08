import { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import type { Restaurant } from '../types';

interface RestaurantSwitcherProps {
  className?: string;
}

export default function RestaurantSwitcher({ className = '' }: RestaurantSwitcherProps) {
  const { restaurant, switchRestaurant, isLoading } = useRestaurant();
  const [isOpen, setIsOpen] = useState(false);
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  const loadAvailableRestaurants = async () => {
    if (availableRestaurants.length > 0) return; // Already loaded
    
    setLoadingRestaurants(true);
    try {
      const response = await fetch('/api/restaurants/my-restaurants');
      if (response.ok) {
        const restaurants = await response.json();
        setAvailableRestaurants(restaurants);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadAvailableRestaurants();
    }
    setIsOpen(!isOpen);
  };

  const handleRestaurantSelect = (restaurantSlug: string) => {
    switchRestaurant(restaurantSlug);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-semibold text-sm">
              {restaurant?.name?.charAt(0) || 'R'}
            </span>
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {restaurant?.name || 'Valitse ravintola'}
            </div>
            <div className="text-sm text-gray-500">
              {restaurant?.slug ? `/r/${restaurant.slug}` : 'Ei valittu'}
            </div>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {loadingRestaurants ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <div className="text-sm text-gray-500 mt-2">Ladataan ravintoloita...</div>
              </div>
            ) : availableRestaurants.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-sm">Ei saatavilla olevia ravintoloita</div>
              </div>
            ) : (
              <div className="py-1">
                {availableRestaurants.map((rest) => (
                  <button
                    key={rest.id}
                    onClick={() => handleRestaurantSelect(rest.slug)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      restaurant?.id === rest.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-semibold text-sm">
                        {rest.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {rest.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        /r/{rest.slug}
                      </div>
                      {rest.subscriptionTier && (
                        <div className="text-xs text-gray-400 capitalize">
                          {rest.subscriptionTier}
                        </div>
                      )}
                    </div>
                    {restaurant?.id === rest.id && (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to restaurant creation or management
                  window.location.href = '/admin/restaurants';
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Lisää uusi ravintola
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
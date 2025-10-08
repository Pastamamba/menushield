import { QueryClient } from "@tanstack/react-query";

// Performance-optimized QueryClient configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - longer cache for better performance
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      retry: 3, // More robust error handling
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Reduce unnecessary API calls
      refetchOnMount: false, // Use cached data when possible
      refetchOnReconnect: true, // Refresh on network reconnection
      networkMode: 'online', // Better offline handling
    },
    mutations: {
      retry: 2, // Retry mutations for better reliability
      networkMode: 'online',
    },
  },
});

// Enhanced query keys for type safety and caching granularity
export const queryKeys = {
  dishes: ["dishes"] as const,
  adminDishes: ["admin", "dishes"] as const,
  restaurant: ["restaurant"] as const,
  ingredients: ["admin", "ingredients"] as const,
  categories: ["admin", "categories"] as const,
  // Restaurant-specific caching
  restaurantMenu: (slug: string) => ["dishes", "restaurant", slug] as const,
  userAllergens: ["user", "allergens"] as const,
} as const;

// Background data prefetching utility
export const prefetchRestaurantData = async (restaurantSlug: string) => {
  const promises = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.restaurantMenu(restaurantSlug),
      staleTime: 1000 * 60 * 5, // 5 minutes for background refresh
    }),
  ];
  
  return Promise.all(promises);
};

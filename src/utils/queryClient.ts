import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for type safety and consistency
export const queryKeys = {
  dishes: ["dishes"] as const,
  adminDishes: ["admin", "dishes"] as const,
  restaurant: ["restaurant"] as const,
  ingredients: ["admin", "ingredients"] as const,
  categories: ["admin", "categories"] as const,
} as const;

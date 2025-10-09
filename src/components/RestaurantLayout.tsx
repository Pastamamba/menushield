import type { ReactNode } from 'react';
import { RestaurantProvider } from '../contexts/RestaurantContext';

interface RestaurantLayoutProps {
  children: ReactNode;
}

export function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <RestaurantProvider>
      {children}
    </RestaurantProvider>
  );
}
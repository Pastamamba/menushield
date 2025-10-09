import React, { useMemo, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import DishCard from './DishCard';
import { MenuItemShimmer } from './LoadingShimmer';
import { performanceMonitor } from '../utils/performanceMonitor';
import type { Dish } from '../types';
import { analyzeDishSafety } from '../utils/dishAnalyzer';

interface VirtualizedDishListProps {
  dishes: Array<{ dish: Dish; safety: ReturnType<typeof analyzeDishSafety> }>;
  showPrices?: boolean;
  currency?: string;
  selectedAllergens?: string[];
  height?: number;
  className?: string;
  onCardSelect?: (dish: Dish) => void;
  onCardLongPress?: (dish: Dish) => void;
}

interface DishRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: Array<{ dish: Dish; safety: ReturnType<typeof analyzeDishSafety> }>;
    showPrices: boolean;
    currency: string;
    onCardSelect?: (dish: Dish) => void;
    onCardLongPress?: (dish: Dish) => void;
  };
}

// Virtualized row component for individual dishes
const DishRow: React.FC<DishRowProps> = ({ index, style, data }) => {
  const { items, showPrices, currency, onCardSelect, onCardLongPress } = data;
  const item = items[index];

  if (!item) {
    return (
      <div style={style}>
        <MenuItemShimmer />
      </div>
    );
  }

  return (
    <div style={style} className="px-2 pb-4">
      <DishCard
        dish={item.dish}
        safetyStatus={item.safety}
        showPrices={showPrices}
        currency={currency}
        onCardSelect={onCardSelect}
        onCardLongPress={onCardLongPress}
      />
    </div>
  );
};

export const VirtualizedDishList: React.FC<VirtualizedDishListProps> = ({
  dishes,
  showPrices = true,
  currency = 'EUR',
  height,
  className = '',
  onCardSelect,
  onCardLongPress,
}) => {
  const listRef = useRef<List>(null);

  // Calculate container height - use viewport height minus header/footer space
  const containerHeight = useMemo(() => {
    if (height) return height;
    
    // Use available viewport height minus estimated header/navigation space
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const estimatedHeaderHeight = 200; // Mobile header + filters
    return Math.max(400, viewportHeight - estimatedHeaderHeight);
  }, [height]);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items: dishes,
    showPrices,
    currency,
    onCardSelect,
    onCardLongPress,
  }), [dishes, showPrices, currency, onCardSelect, onCardLongPress]);

  // Performance monitoring for virtualized scrolling
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    if (process.env.NODE_ENV === 'development') {
      const visibleItems = visibleStopIndex - visibleStartIndex + 1;
      performanceMonitor.setMetric('Virtualized Visible Items', visibleItems);
      performanceMonitor.setMetric('Total Items', dishes.length);
    }
  }, [dishes.length]);

  // Enhanced scroll performance with throttling
  const handleScroll = useCallback(({ scrollOffset }: any) => {
    // Add haptic feedback for mobile on significant scroll movements
    if ('vibrate' in navigator && scrollOffset % 500 < 10) {
      navigator.vibrate(10); // Subtle scroll feedback
    }
  }, []);

  // Calculate optimal item height based on device
  const itemHeight = useMemo(() => {
    // Slightly taller for mobile touch targets
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? 180 : 160; // DishCard approximate height + padding
  }, []);

  // Handle empty state
  if (dishes.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
        <p className="text-gray-600">Try adjusting your search or allergen filters</p>
      </div>
    );
  }

  return (
    <div className={`virtualized-dish-list ${className}`}>
      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 rounded">
          📊 Virtualized: {dishes.length} total dishes, ~{Math.ceil(containerHeight / itemHeight)} visible
        </div>
      )}
      
      <List
        ref={listRef}
        height={containerHeight}
        width="100%"
        itemCount={dishes.length}
        itemSize={itemHeight}
        itemData={itemData}
        onItemsRendered={handleItemsRendered}
        onScroll={handleScroll}
        overscanCount={3} // Render 3 extra items for smooth scrolling
        className="virtualized-list"
      >
        {DishRow}
      </List>
    </div>
  );
};

// Hook for determining when to use virtualized scrolling
export const useVirtualizedScrolling = (itemCount: number, threshold = 20) => {
  return useMemo(() => {
    // Use virtualized scrolling for lists with more than threshold items
    // or on mobile devices for better performance
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return itemCount > threshold || (isMobile && itemCount > 10);
  }, [itemCount, threshold]);
};
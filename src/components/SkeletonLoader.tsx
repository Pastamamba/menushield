// src/components/SkeletonLoader.tsx
import React from 'react';

interface SkeletonLoaderProps {
  type: 'dish-card' | 'dish-grid' | 'filter' | 'header';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 6 }) => {
  const shimmer = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";
  
  if (type === 'dish-card') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Card Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className={`h-5 w-3/4 rounded mb-2 ${shimmer}`} />
              <div className={`h-4 w-1/2 rounded ${shimmer}`} />
            </div>
            <div className={`h-8 w-16 rounded-full ${shimmer}`} />
          </div>
          
          {/* Description */}
          <div className={`h-3 w-full rounded mb-2 ${shimmer}`} />
          <div className={`h-3 w-2/3 rounded ${shimmer}`} />
        </div>
        
        {/* Allergen Tags */}
        <div className="px-4 pb-4">
          <div className={`h-3 w-16 rounded mb-2 ${shimmer}`} />
          <div className="flex gap-2">
            <div className={`h-6 w-16 rounded-full ${shimmer}`} />
            <div className={`h-6 w-12 rounded-full ${shimmer}`} />
            <div className={`h-6 w-14 rounded-full ${shimmer}`} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'dish-grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonLoader key={i} type="dish-card" />
        ))}
      </div>
    );
  }

  if (type === 'filter') {
    return (
      <div className="mb-6">
        {/* Filter Header */}
        <div className={`h-6 w-32 rounded mb-4 ${shimmer}`} />
        
        {/* Search Box */}
        <div className={`h-12 w-full rounded-lg mb-4 ${shimmer}`} />
        
        {/* Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-12 rounded-lg ${shimmer}`} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'header') {
    return (
      <div className="mb-6">
        <div className={`h-8 w-48 rounded mb-2 ${shimmer}`} />
        <div className={`h-4 w-64 rounded ${shimmer}`} />
      </div>
    );
  }

  return null;
};

// Specialized skeleton for mobile filter drawer
export const MobileFilterSkeleton: React.FC = () => {
  const shimmer = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]";
  
  return (
    <div className="p-4 space-y-4">
      <div className={`h-6 w-24 rounded ${shimmer}`} />
      <div className={`h-10 w-full rounded-lg ${shimmer}`} />
      
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-10 rounded-lg ${shimmer}`} />
        ))}
      </div>
      
      <div className={`h-12 w-full rounded-lg ${shimmer}`} />
    </div>
  );
};

export default SkeletonLoader;
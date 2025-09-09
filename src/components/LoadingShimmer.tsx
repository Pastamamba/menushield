export function LoadingShimmer() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded loading-shimmer"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded loading-shimmer w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded loading-shimmer w-1/2"></div>
      </div>
    </div>
  );
}

export function MenuItemShimmer() {
  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-gray-200 p-4 animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="h-6 bg-gray-200 rounded loading-shimmer w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded loading-shimmer w-16"></div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded loading-shimmer"></div>
        <div className="h-4 bg-gray-200 rounded loading-shimmer w-2/3"></div>
      </div>

      <div className="h-6 bg-gray-200 rounded loading-shimmer w-20"></div>
    </div>
  );
}

// Export the MenuLoadingState component
export function MenuLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Shimmer */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center animate-pulse">
            <div className="h-8 bg-gray-200 rounded loading-shimmer w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded loading-shimmer w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded loading-shimmer w-32 mx-auto"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl">
        {/* Instructions Shimmer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-blue-200 rounded loading-shimmer w-48 mb-2"></div>
          <div className="space-y-1">
            <div className="h-4 bg-blue-200 rounded loading-shimmer"></div>
            <div className="h-4 bg-blue-200 rounded loading-shimmer w-5/6"></div>
            <div className="h-4 bg-blue-200 rounded loading-shimmer w-4/5"></div>
          </div>
        </div>

        {/* Allergen Filter Shimmer */}
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded loading-shimmer w-48 mb-4"></div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded-lg loading-shimmer"
              ></div>
            ))}
          </div>
        </div>

        {/* Menu Items Shimmer */}
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded loading-shimmer w-32"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <MenuItemShimmer key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

// Simplified offline manager for deployment
export const offlineManager = {
  hasCachedMenu: () => Promise.resolve(false),
  getCachedMenu: () => Promise.resolve([]),
  getLastCacheUpdate: () => Promise.resolve(undefined),
  clearCache: () => Promise.resolve(),
  cacheMenu: () => Promise.resolve(),
  invalidateMenuCache: () => Promise.resolve(),
};

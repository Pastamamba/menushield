// Performance monitoring utilities for MenuShield optimization

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  // Start timing a performance metric
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  // End timing and record metric
  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    this.startTimes.delete(name);

    return duration;
  }

  // Get all recorded metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Set metric externally (for web vitals)
  setMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  // Log performance summary
  logSummary(): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Performance Summary');
      this.metrics.forEach((time, name) => {
        const status = time < 100 ? '🟢' : time < 500 ? '🟡' : '🔴';
        console.log(`${status} ${name}: ${time.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceTimer = (componentName: string) => {
  const startTimer = () => performanceMonitor.startTimer(componentName);
  const endTimer = () => performanceMonitor.endTimer(componentName);
  
  return { startTimer, endTimer };
};

// Decorator for monitoring API calls
export const withApiTiming = async <T>(
  apiCall: () => Promise<T>,
  name: string
): Promise<T> => {
  performanceMonitor.startTimer(`API: ${name}`);
  try {
    const result = await apiCall();
    performanceMonitor.endTimer(`API: ${name}`);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(`API: ${name}`);
    throw error;
  }
};

// Bundle size monitoring (development only)
export const logBundleSize = () => {
  if (process.env.NODE_ENV === 'development' && 'navigator' in window) {
    // Use performance API to estimate loaded resources
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0);
    
    console.log(`📦 Estimated Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
};

// Web Vitals monitoring
export const initWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Monitor Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      performanceMonitor.setMetric('LCP', lcp.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Type assertion for FID entry
        const fidEntry = entry as any;
        if (fidEntry.processingStart) {
          const fid = fidEntry.processingStart - fidEntry.startTime;
          performanceMonitor.setMetric('FID', fid);
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Log summary after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor.logSummary();
        logBundleSize();
      }, 1000);
    });
  }
};
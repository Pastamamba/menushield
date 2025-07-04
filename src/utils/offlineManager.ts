// Service Worker registration and offline management
export class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // Register service worker
    if ("serviceWorker" in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js");
        console.log("MenuShield: Service Worker registered");

        // Listen for updates
        this.swRegistration.addEventListener("updatefound", () => {
          console.log("MenuShield: Service Worker update found");
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener(
          "message",
          this.handleSWMessage.bind(this)
        );
      } catch (error) {
        console.error("MenuShield: Service Worker registration failed:", error);
      }
    }

    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));
  }

  private handleSWMessage(event: MessageEvent) {
    const { data } = event;

    if (data.type === "MENU_UPDATED") {
      console.log("MenuShield: Menu data updated from service worker");
      // Trigger a refresh of menu data in components
      this.notifyListeners(this.isOnline);
    }
  }

  private handleOnline() {
    console.log("MenuShield: Back online");
    this.isOnline = true;
    this.notifyListeners(true);

    // Trigger background sync
    this.requestBackgroundSync();
  }

  private handleOffline() {
    console.log("MenuShield: Gone offline");
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((listener) => listener(isOnline));
  }

  public addListener(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);

    // Immediately call with current state
    callback(this.isOnline);

    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }

  public async requestBackgroundSync() {
    if (
      this.swRegistration &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        await this.swRegistration.sync.register("menu-sync");
        console.log("MenuShield: Background sync requested");
      } catch (error) {
        console.error(
          "MenuShield: Background sync registration failed:",
          error
        );
      }
    }
  }

  public async clearCache() {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
        console.log("MenuShield: All caches cleared");
      } catch (error) {
        console.error("MenuShield: Cache clearing failed:", error);
      }
    }
  }

  public async getCacheStatus(): Promise<{
    hasMenuCache: boolean;
    cacheSize: number;
    lastUpdate?: Date;
  }> {
    if (!("caches" in window)) {
      return { hasMenuCache: false, cacheSize: 0 };
    }

    try {
      const cache = await caches.open("menushield-menu-v1");
      const requests = await cache.keys();
      const hasMenuCache = requests.some((req) =>
        req.url.includes("/api/menu")
      );

      return {
        hasMenuCache,
        cacheSize: requests.length,
        lastUpdate: new Date(), // In real implementation, store timestamp in cache
      };
    } catch (error) {
      console.error("MenuShield: Cache status check failed:", error);
      return { hasMenuCache: false, cacheSize: 0 };
    }
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

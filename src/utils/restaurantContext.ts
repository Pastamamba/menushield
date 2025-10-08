import type { User, Restaurant, UserRole } from '../types';

/**
 * Restaurant Context Utilities for Multi-tenant MenuShield
 * 
 * These utilities handle restaurant selection, user permissions,
 * and tenant isolation throughout the application.
 */

// Restaurant context type for React context
export interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  userRestaurant: Restaurant | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  switchRestaurant: (restaurantSlug: string) => Promise<void>;
  refreshRestaurant: () => Promise<void>;
}

// User permission utilities
export class UserPermissions {
  private user: User | null;
  private restaurant: Restaurant | null;

  constructor(user: User | null, restaurant: Restaurant | null) {
    this.user = user;
    this.restaurant = restaurant;
  }

  // Check if user has access to current restaurant
  hasRestaurantAccess(): boolean {
    if (!this.user || !this.restaurant) return false;
    return this.user.restaurantId === this.restaurant.id;
  }

  // Check if user can perform specific actions
  canEditMenu(): boolean {
    if (!this.hasRestaurantAccess()) return false;
    return ['OWNER', 'ADMIN'].includes(this.user!.role);
  }

  canEditRestaurantSettings(): boolean {
    if (!this.hasRestaurantAccess()) return false;
    return ['OWNER', 'ADMIN'].includes(this.user!.role);
  }

  canManageUsers(): boolean {
    if (!this.hasRestaurantAccess()) return false;
    return this.user!.role === 'OWNER';
  }

  canViewMenu(): boolean {
    return this.hasRestaurantAccess(); // All roles can view menu
  }

  canEditIngredients(): boolean {
    if (!this.hasRestaurantAccess()) return false;
    return ['OWNER', 'ADMIN'].includes(this.user!.role);
  }

  canExportData(): boolean {
    if (!this.hasRestaurantAccess()) return false;
    return ['OWNER', 'ADMIN'].includes(this.user!.role);
  }

  // Get user's role display name
  getRoleDisplayName(): string {
    const roleNames: Record<UserRole, string> = {
      OWNER: 'Owner',
      ADMIN: 'Administrator',
      STAFF: 'Staff Member',
      VIEWER: 'Viewer'
    };
    return this.user ? roleNames[this.user.role] : 'Guest';
  }
}

// Restaurant slug utilities
export class RestaurantSlugUtils {
  // Generate SEO-friendly slug from restaurant name
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  }

  // Validate slug format
  static isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
  }

  // Extract restaurant slug from URL
  static extractSlugFromUrl(url: string): string | null {
    const patterns = [
      /\/menu\/([a-z0-9-]+)/, // /menu/:slug
      /\/([a-z0-9-]+)\/admin/, // /:slug/admin
      /\/([a-z0-9-]+)$/, // /:slug (root)
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}

// API URL builders for restaurant-scoped endpoints
export class RestaurantApiUrls {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // Public endpoints (no auth required)
  getMenuUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/menu`;
  }

  getRestaurantInfoUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}`;
  }

  // Admin endpoints (auth required)
  getAdminMenuUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/menu`;
  }

  getAdminDishUrl(restaurantSlug: string, dishId?: string): string {
    const baseUrl = `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/menu`;
    return dishId ? `${baseUrl}/${dishId}` : baseUrl;
  }

  getAdminIngredientsUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/ingredients`;
  }

  getAdminCategoriesUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/categories`;
  }

  getAdminRestaurantUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/settings`;
  }

  getAdminUsersUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/users`;
  }

  getAdminInvitationsUrl(restaurantSlug: string): string {
    return `${this.baseUrl}/api/restaurant/${restaurantSlug}/admin/invitations`;
  }
}

// Tenant isolation middleware helpers for API
export interface TenantContext {
  restaurantId: string;
  restaurantSlug: string;
  userId: string;
  userRole: UserRole;
}

export class TenantIsolation {
  // Validate that user has access to restaurant
  static validateTenantAccess(user: User, restaurantId: string): boolean {
    return user.restaurantId === restaurantId;
  }

  // Create tenant context from request
  static createTenantContext(user: User, restaurantSlug: string): TenantContext {
    return {
      restaurantId: user.restaurantId,
      restaurantSlug,
      userId: user.id,
      userRole: user.role,
    };
  }

  // Build where clause for tenant-scoped queries
  static buildTenantWhere(restaurantId: string, additionalWhere: any = {}): any {
    return {
      restaurantId,
      ...additionalWhere,
    };
  }

  // Build tenant-scoped include clause
  static buildTenantInclude(includeRestaurant: boolean = false): any {
    const include: any = {};
    
    if (includeRestaurant) {
      include.restaurant = {
        select: {
          id: true,
          name: true,
          slug: true,
          currency: true,
          defaultLanguage: true,
          supportedLanguages: true,
        }
      };
    }

    return include;
  }
}

// Restaurant-specific error types
export class TenantError extends Error {
  public code: 'TENANT_ACCESS_DENIED' | 'RESTAURANT_NOT_FOUND' | 'INVALID_SLUG' | 'USER_NOT_IN_RESTAURANT';

  constructor(
    message: string,
    code: 'TENANT_ACCESS_DENIED' | 'RESTAURANT_NOT_FOUND' | 'INVALID_SLUG' | 'USER_NOT_IN_RESTAURANT'
  ) {
    super(message);
    this.name = 'TenantError';
    this.code = code;
  }
}

// URL generators for frontend routing
export class RestaurantRoutes {
  // Generate restaurant-specific URLs
  static getMenuUrl(restaurantSlug: string): string {
    return `/menu/${restaurantSlug}`;
  }

  static getAdminUrl(restaurantSlug: string): string {
    return `/${restaurantSlug}/admin`;
  }

  static getQRCodeUrl(restaurantSlug: string): string {
    return `/${restaurantSlug}/admin/qr`;
  }

  static getSettingsUrl(restaurantSlug: string): string {
    return `/${restaurantSlug}/admin/settings`;
  }

  // Short URLs for QR codes
  static getShortMenuUrl(restaurantSlug: string): string {
    return `/m/${restaurantSlug}`;
  }
}

export default {
  UserPermissions,
  RestaurantSlugUtils,
  RestaurantApiUrls,
  TenantIsolation,
  TenantError,
  RestaurantRoutes,
};
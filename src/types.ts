export interface DishComponent {
  id: string;
  name: string;
  type: "base" | "protein" | "sauce" | "side" | "garnish" | "other";
  ingredients: string[];
  allergen_tags: string[];
  is_required: boolean; // Base components are required, others can be removed/swapped
  is_locked?: boolean; // Admin can lock optional components to make them required
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  components: DishComponent[];
  // Legacy fields for backward compatibility
  ingredients: string[];
  allergen_tags: string[] | any; // Allow any type for backward compatibility
  modification_note: string | null;
  is_modifiable: boolean;
  is_active?: boolean; // For dish activation toggle
  is_featured?: boolean; // Featured dish highlighting
  display_order?: number; // Custom ordering
  image_url?: string; // Dish image
  // Multi-tenant relationship
  restaurantId: string;
  restaurant?: Restaurant;
  categoryId?: string;
  // Multilingual support
  translations?: string; // JSON string containing translations
  created_at?: string;
  updated_at?: string;
}

export interface AllergenTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface AllergenInfo {
  tag: string;
  component: string;
  componentType: "base" | "protein" | "sauce" | "side" | "garnish" | "other";
  canModify: boolean;
}

export interface DishSafetyStatus {
  status: "safe" | "modifiable" | "unsafe";
  allergens: AllergenInfo[];
  modificationSuggestion?: string;
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  // Legacy fields for backward compatibility
  ingredients: string[];
  allergen_tags: string[];
  modification_note?: string;
  is_modifiable?: boolean;
  is_active?: boolean;
  // New component-based system (optional for now)
  components?: Omit<DishComponent, "id">[];
}

export interface UpdateDishRequest extends Partial<CreateDishRequest> {
  id: string;
}

// Ingredient Management Types
export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  allergen_tags: string[];
  isActive: boolean;
  // Multi-tenant relationship
  restaurantId: string;
  restaurant?: Restaurant;
  categoryId?: string;
  category?: IngredientCategory;
  // Hierarchy support
  parentId?: string;
  parent?: Ingredient;
  children?: Ingredient[];
  // Multilingual support
  translations?: string; // JSON string containing translations
  created_at: string;
  updated_at: string;
}

export interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  // Multi-tenant relationship
  restaurantId: string;
  restaurant?: Restaurant;
  // Multilingual support
  translations?: string; // JSON string containing translations
  created_at: string;
  updated_at: string;
  // Relationships
  ingredients?: Ingredient[];
  dishes?: Dish[];
}

export interface CreateIngredientRequest {
  name: string;
  category?: string;
  parentId?: string;
  allergen_tags: string[];
}

export interface UpdateIngredientRequest
  extends Partial<CreateIngredientRequest> {
  id: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

// Multilingual Support Types
export interface AllergenTranslation {
  id: string;
  allergen_key: string; // e.g., "dairy", "gluten"
  translations: string; // JSON string containing language translations
  created_at: string;
  updated_at: string;
}

// Multi-tenant User and Restaurant Types
export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  restaurantId: string;
  restaurant?: Restaurant;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string; // SEO-friendly URL identifier
  description?: string;
  contact?: string;
  website?: string;
  address?: string;
  showPrices: boolean;
  currency: string;
  timezone: string;
  // Multilingual support
  defaultLanguage: string;
  supportedLanguages: string; // JSON array of supported language codes
  // Business settings
  isActive: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  // Relationships
  users?: User[];
  dishes?: Dish[];
  categories?: IngredientCategory[];
  ingredients?: Ingredient[];
}

export interface RestaurantInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  isUsed: boolean;
  expiresAt: string;
  restaurantId: string;
  restaurant?: Restaurant;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

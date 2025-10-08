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
  // Legacy fields for backward compatibility - exact database field names
  ingredients: string[];
  allergen_tags: string[] | any; // Matches database: allergen_tags
  modification_note: string | null; // Matches database: modification_note
  is_modifiable: boolean; // Matches database: is_modifiable
  is_active?: boolean; // Matches database: is_active
  is_featured?: boolean; // Matches database: is_featured
  display_order?: number; // Matches database: display_order
  image_url?: string; // Matches database: image_url
  // Multi-tenant relationship
  restaurantId: string; // Matches database: restaurant_id
  restaurant?: Restaurant;
  categoryId?: string; // Matches database: category_id
  // Multilingual support
  translations?: string; // JSON string containing translations
  created_at?: string; // Matches database: created_at
  updated_at?: string; // Matches database: updated_at
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
  allergenTags: string[]; // Matches database: allergen_tags (will be parsed from JSON)
  isActive: boolean; // Matches database: is_active
  // Multi-tenant relationship
  restaurantId: string; // Matches database: restaurant_id
  restaurant?: Restaurant;
  categoryId?: string; // Matches database: category_id
  category?: IngredientCategory;
  // Hierarchy support
  parentId?: string; // Matches database: parent_id
  parent?: Ingredient;
  children?: Ingredient[];
  // Multilingual support
  translations?: string; // JSON string containing translations
  createdAt: string; // Matches database: created_at
  updatedAt: string; // Matches database: updated_at
}

export interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  displayOrder: number; // Matches database: display_order
  isActive: boolean; // Matches database: is_active
  // Multi-tenant relationship
  restaurantId: string; // Matches database: restaurant_id
  restaurant?: Restaurant;
  // Multilingual support
  translations?: string; // JSON string containing translations
  createdAt: string; // Matches database: created_at
  updatedAt: string; // Matches database: updated_at
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
  showPrices: boolean; // Matches database: show_prices
  currency: string;
  timezone: string;
  // Multilingual support - exact database field names
  defaultLanguage: string; // Matches database: default_language
  supportedLanguages: string; // Matches database: supported_languages (JSON array)
  // Business settings
  isActive: boolean; // Matches database: is_active
  subscriptionTier: 'free' | 'premium' | 'enterprise'; // Matches database: subscription_tier
  createdAt: string; // Matches database: created_at
  updatedAt: string; // Matches database: updated_at
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

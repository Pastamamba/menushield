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
  category?: string;
  parentId?: string; // For hierarchical ingredients (e.g., "Salmon" parent is "Fish")
  allergen_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
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

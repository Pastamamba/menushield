export interface Dish {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  ingredients: string[];
  allergen_tags: string[];
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

export interface CreateDishRequest {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  ingredients: string[];
  allergen_tags: string[];
  modification_note?: string;
  is_modifiable: boolean;
}

export interface UpdateDishRequest extends Partial<CreateDishRequest> {
  id: string;
}

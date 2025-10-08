// Workspace change for Railway build trigger
import type { Dish, DishSafetyStatus, AllergenInfo } from "../types";
import { calculateAllergensFromIngredients } from "./allergenCalculator";

// Top 8 most common allergens for main display
export const COMMON_ALLERGENS = [
  { id: "dairy", name: "Dairy", color: "blue" },
  { id: "gluten", name: "Gluten", color: "yellow" },
  { id: "nuts", name: "Tree Nuts", color: "brown" },
  { id: "peanuts", name: "Peanuts", color: "orange" },
  { id: "shellfish", name: "Shellfish", color: "red" },
  { id: "fish", name: "Fish", color: "cyan" },
  { id: "eggs", name: "Eggs", color: "yellow" },
  { id: "soy", name: "Soy", color: "green" },
];

// Extended allergen list for search
export const ALL_ALLERGENS = [
  ...COMMON_ALLERGENS,
  { id: "sesame", name: "Sesame", color: "tan" },
  { id: "sulfites", name: "Sulfites", color: "purple" },
  { id: "mustard", name: "Mustard", color: "yellow" },
  { id: "celery", name: "Celery", color: "green" },
  { id: "lupin", name: "Lupin", color: "pink" },
  { id: "molluscs", name: "Molluscs", color: "teal" },
  { id: "corn", name: "Corn", color: "yellow" },
  { id: "coconut", name: "Coconut", color: "white" },
  { id: "nightshades", name: "Nightshades", color: "red" },
  { id: "citrus", name: "Citrus", color: "orange" },
];

/**
 * Safely converts any allergen_tags value to string array
 */
function safeAllergenTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return [tags];
  if (tags && typeof tags === 'object' && 'length' in tags) {
    try {
      return Array.from(tags as ArrayLike<string>);
    } catch {
      return [];
    }
  }
  if (tags && typeof tags === 'object') {
    try {
      return Object.values(tags).filter(v => typeof v === 'string') as string[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Analyzes a dish's safety status based on user's avoided allergens
 */
export function analyzeDishSafety(
  dish: Dish,
  avoidAllergens: string[],
  availableIngredients?: any[]
): DishSafetyStatus {
  const allergenInfo: AllergenInfo[] = [];

  // Migrate dish to component format for analysis
  const migratedDish = migrateDishToComponents(dish, availableIngredients);

  // Check each component for allergens
  for (const component of migratedDish.components) {
    for (const allergen of safeAllergenTags(component.allergen_tags)) {
      if (avoidAllergens.includes(allergen)) {
        allergenInfo.push({
          tag: allergen,
          component: component.name,
          componentType: component.type,
          canModify: !component.is_required && !component.is_locked,
        });
      }
    }
  }

  // If no allergens found, dish is safe
  if (allergenInfo.length === 0) {
    return { status: "safe", allergens: [] };
  }

  // Check if any allergens are in required components (base, locked, or required)
  const hasRequiredAllergens = allergenInfo.some((info) => !info.canModify);

  if (hasRequiredAllergens) {
    return {
      status: "unsafe",
      allergens: allergenInfo,
    };
  }

  // All allergens are in modifiable components
  const modifiableComponents = [
    ...new Set(allergenInfo.map((info) => info.component)),
  ];
  const suggestion = generateModificationSuggestion(modifiableComponents);

  return {
    status: "modifiable",
    allergens: allergenInfo,
    modificationSuggestion: suggestion,
  };
}

/**
 * Generates a suggestion for how to modify a dish
 */
function generateModificationSuggestion(components: string[]): string {
  if (components.length === 1) {
    return `This dish contains an allergen in the ${components[0]} component. You may be able to enjoy it by asking your server to remove or swap the ${components[0]}.`;
  } else if (components.length === 2) {
    return `This dish contains allergens in the ${components[0]} and ${components[1]} components. You may be able to enjoy it by asking your server to remove or swap these components.`;
  } else {
    const lastComponent = components.pop();
    return `This dish contains allergens in the ${components.join(
      ", "
    )}, and ${lastComponent} components. You may be able to enjoy it by asking your server to remove or swap these components.`;
  }
}

/**
 * Gets allergen information by ID
 */
export function getAllergenInfo(allergenId: string) {
  return ALL_ALLERGENS.find((allergen) => allergen.id === allergenId);
}

/**
 * Filters allergens based on search query
 */
export function searchAllergens(query: string): typeof ALL_ALLERGENS {
  if (!query.trim()) return COMMON_ALLERGENS;

  const lowerQuery = query.toLowerCase();
  return ALL_ALLERGENS.filter(
    (allergen) =>
      allergen.name.toLowerCase().includes(lowerQuery) ||
      allergen.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Legacy compatibility: converts old dish format to component-based
 */
export function migrateDishToComponents(dish: Dish, availableIngredients?: any[]): Dish {
  // If dish already has components, return as-is
  if (dish.components && dish.components.length > 0) {
    return dish;
  }

  // Get ingredients array
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];

  // Calculate allergens automatically from ingredients
  let allergenTags: string[] = [];
  
  if (availableIngredients) {
    // Use automatic calculation if ingredients database is available
    allergenTags = calculateAllergensFromIngredients(ingredients, availableIngredients);
  } else {
    // Fallback to existing allergen_tags if no ingredient database
    const existingTags = dish.allergen_tags;
    if (existingTags && Array.isArray(existingTags) && existingTags.length > 0) {
      allergenTags = existingTags;
    } else {
      allergenTags = safeAllergenTags(existingTags);
    }
  }

  // Create a single "base" component from legacy data
  const baseComponent = {
    id: `${dish.id}-base`,
    name: "Base",
    type: "base" as const,
    ingredients,
    allergen_tags: allergenTags,
    is_required: true,
  };

  return {
    ...dish,
    components: [baseComponent],
    allergen_tags: allergenTags, // Update dish-level allergens too
  };
}

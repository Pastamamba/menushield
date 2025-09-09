import type { Dish, DishSafetyStatus, AllergenInfo } from "../types";

// Common allergens with expanded list
export const COMMON_ALLERGENS = [
  { id: "dairy", name: "Dairy", icon: "🥛", color: "blue" },
  { id: "gluten", name: "Gluten", icon: "🌾", color: "yellow" },
  { id: "nuts", name: "Tree Nuts", icon: "🥜", color: "brown" },
  { id: "peanuts", name: "Peanuts", icon: "🥜", color: "orange" },
  { id: "shellfish", name: "Shellfish", icon: "🦐", color: "red" },
  { id: "fish", name: "Fish", icon: "🐟", color: "cyan" },
  { id: "eggs", name: "Eggs", icon: "🥚", color: "yellow" },
  { id: "soy", name: "Soy", icon: "🫘", color: "green" },
  { id: "sesame", name: "Sesame", icon: "🫘", color: "tan" },
  { id: "sulfites", name: "Sulfites", icon: "🍷", color: "purple" },
  { id: "mustard", name: "Mustard", icon: "🟡", color: "yellow" },
  { id: "celery", name: "Celery", icon: "🥬", color: "green" },
];

// Extended allergen list for search
export const ALL_ALLERGENS = [
  ...COMMON_ALLERGENS,
  { id: "lupin", name: "Lupin", icon: "🌸", color: "pink" },
  { id: "molluscs", name: "Molluscs", icon: "🐚", color: "teal" },
  { id: "corn", name: "Corn", icon: "🌽", color: "yellow" },
  { id: "coconut", name: "Coconut", icon: "🥥", color: "white" },
  { id: "nightshades", name: "Nightshades", icon: "🍅", color: "red" },
  { id: "citrus", name: "Citrus", icon: "🍊", color: "orange" },
];

/**
 * Analyzes a dish's safety status based on user's avoided allergens
 */
export function analyzeDishSafety(
  dish: Dish,
  avoidAllergens: string[]
): DishSafetyStatus {
  const allergenInfo: AllergenInfo[] = [];

  // Check each component for allergens
  for (const component of dish.components) {
    for (const allergen of component.allergen_tags) {
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
export function migrateDishToComponents(dish: Dish): Dish {
  // If dish already has components, return as-is
  if (dish.components && dish.components.length > 0) {
    return dish;
  }

  // Create a single "base" component from legacy data
  const baseComponent = {
    id: `${dish.id}-base`,
    name: "Base",
    type: "base" as const,
    ingredients: dish.ingredients || [],
    allergen_tags: dish.allergen_tags || [],
    is_required: true,
  };

  return {
    ...dish,
    components: [baseComponent],
  };
}

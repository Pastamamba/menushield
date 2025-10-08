import type { Ingredient } from '../types';

/**
 * Calculate allergens automatically based on selected ingredients
 */
export function calculateAllergensFromIngredients(
  selectedIngredients: string[],
  availableIngredients: Ingredient[]
): string[] {
  const allergens = new Set<string>();
  
  selectedIngredients.forEach(ingredientName => {
    const ingredient = availableIngredients.find(ing => ing.name === ingredientName);
    if (ingredient && Array.isArray(ingredient.allergenTags)) {
      ingredient.allergenTags.forEach((allergen: string) => allergens.add(allergen));
    }
  });
  
  return Array.from(allergens).sort();
}

/**
 * Get allergen chips for display
 */
export function getAllergenChips(allergens: string[]): { name: string; color: string }[] {
  const allergenMap: Record<string, { color: string }> = {
    'gluten': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'dairy': { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'eggs': { color: 'bg-orange-100 text-orange-800 border-orange-200' },
    'fish': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    'shellfish': { color: 'bg-red-100 text-red-800 border-red-200' },
    'nuts': { color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'peanuts': { color: 'bg-brown-100 text-brown-800 border-brown-200' },
    'soy': { color: 'bg-green-100 text-green-800 border-green-200' },
    'sesame': { color: 'bg-stone-100 text-stone-800 border-stone-200' },
    'sulfites': { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'mustard': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'celery': { color: 'bg-lime-100 text-lime-800 border-lime-200' },
    'lupin': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'molluscs': { color: 'bg-teal-100 text-teal-800 border-teal-200' },
  };

  return allergens.map(allergen => ({
    name: allergen,
    color: allergenMap[allergen.toLowerCase()]?.color || 'bg-gray-100 text-gray-800 border-gray-200',
  }));
}

/**
 * Common allergen tags for ingredient creation
 */
export const COMMON_ALLERGENS = [
  'gluten',
  'dairy', 
  'eggs',
  'fish',
  'shellfish',
  'nuts',
  'peanuts',
  'soy',
  'sesame',
  'sulfites',
  'mustard',
  'celery',
  'lupin',
  'molluscs'
];

/**
 * Predefined ingredient-allergen mappings for quick setup
 */
export const INGREDIENT_ALLERGEN_MAPPINGS: Record<string, string[]> = {
  // Dairy
  'milk': ['dairy'],
  'cheese': ['dairy'],
  'butter': ['dairy'],
  'cream': ['dairy'],
  'yogurt': ['dairy'],
  'mozzarella': ['dairy'],
  'parmesan': ['dairy'],
  'cheddar': ['dairy'],
  
  // Gluten
  'wheat flour': ['gluten'],
  'bread': ['gluten'],
  'pasta': ['gluten'],
  'noodles': ['gluten'],
  'soy sauce': ['gluten', 'soy'],
  'beer': ['gluten'],
  
  // Fish & Seafood
  'salmon': ['fish'],
  'tuna': ['fish'],
  'cod': ['fish'],
  'shrimp': ['shellfish'],
  'crab': ['shellfish'],
  'lobster': ['shellfish'],
  'mussels': ['molluscs'],
  'oysters': ['molluscs'],
  
  // Nuts
  'almonds': ['nuts'],
  'walnuts': ['nuts'],
  'cashews': ['nuts'],
  'pistachios': ['nuts'],
  'peanuts': ['peanuts'],
  'peanut butter': ['peanuts'],
  
  // Eggs
  'eggs': ['eggs'],
  'egg whites': ['eggs'],
  'egg yolks': ['eggs'],
  'mayonnaise': ['eggs'],
  
  // Soy
  'tofu': ['soy'],
  'tempeh': ['soy'],
  'edamame': ['soy'],
  'soy milk': ['soy'],
  
  // Other
  'sesame oil': ['sesame'],
  'tahini': ['sesame'],
  'wine': ['sulfites'],
  'mustard': ['mustard'],
  'celery': ['celery'],
};

/**
 * Get suggested allergens for an ingredient name
 */
export function getSuggestedAllergens(ingredientName: string): string[] {
  const name = ingredientName.toLowerCase();
  
  // Check exact matches first
  if (INGREDIENT_ALLERGEN_MAPPINGS[name]) {
    return INGREDIENT_ALLERGEN_MAPPINGS[name];
  }
  
  // Check partial matches
  const suggestions: string[] = [];
  for (const [ingredient, allergens] of Object.entries(INGREDIENT_ALLERGEN_MAPPINGS)) {
    if (name.includes(ingredient) || ingredient.includes(name)) {
      suggestions.push(...allergens);
    }
  }
  
  return Array.from(new Set(suggestions));
}
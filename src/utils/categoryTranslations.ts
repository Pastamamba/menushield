// Category translations for the menu
export const categoryTranslations = {
  en: {
    // Common food categories
    "Category": "Category",
    "All": "All",
    "Appetizer": "Appetizer",
    "Starter": "Starter", 
    "Main Course": "Main Course",
    "Main": "Main",
    "Dessert": "Dessert",
    "Beverage": "Beverage",
    "Drink": "Drink",
    "Salad": "Salad",
    "Soup": "Soup",
    "Side Dish": "Side Dish",
    "Side": "Side",
    "Pasta": "Pasta",
    "Pizza": "Pizza",
    "Fish": "Fish",
    "Meat": "Meat",
    "Vegetarian": "Vegetarian",
    "Vegan": "Vegan",
    "Other": "Other",
    "Uncategorized": "Uncategorized",
    // Restaurant-specific categories
    "Pääruoat": "Main Courses",
    "Alkupalat": "Appetizers",
    "Jälkiruoat": "Desserts",
    "Juomat": "Beverages"
  },
  
  fi: {
    // Common food categories
    "Category": "Kategoria",
    "All": "Kaikki",
    "Appetizer": "Alkupala",
    "Starter": "Alkupala",
    "Main Course": "Pääruoka", 
    "Main": "Pääruoka",
    "Dessert": "Jälkiruoka",
    "Beverage": "Juoma",
    "Drink": "Juoma",
    "Salad": "Salaatti",
    "Soup": "Keitto",
    "Side Dish": "Lisuke",
    "Side": "Lisuke",
    "Pasta": "Pasta",
    "Pizza": "Pizza",
    "Fish": "Kala",
    "Meat": "Liha",
    "Vegetarian": "Kasvisruoka",
    "Vegan": "Vegaani",
    "Other": "Muu",
    "Uncategorized": "Luokittelematon",
    // Already Finnish
    "Pääruoat": "Pääruoat",
    "Alkupalat": "Alkupalat", 
    "Jälkiruoat": "Jälkiruoat",
    "Juomat": "Juomat"
  },
  
  sv: {
    // Common food categories
    "Category": "Kategori",
    "All": "Alla",
    "Appetizer": "Förrätt",
    "Starter": "Förrätt",
    "Main Course": "Huvudrätt",
    "Main": "Huvudrätt", 
    "Dessert": "Efterrätt",
    "Beverage": "Dryck",
    "Drink": "Dryck",
    "Salad": "Sallad",
    "Soup": "Soppa",
    "Side Dish": "Tillbehör",
    "Side": "Tillbehör",
    "Pasta": "Pasta",
    "Pizza": "Pizza",
    "Fish": "Fisk",
    "Meat": "Kött",
    "Vegetarian": "Vegetarisk",
    "Vegan": "Vegan",
    "Other": "Annat",
    "Uncategorized": "Okategoriserad",
    // Finnish to Swedish
    "Pääruoat": "Huvudrätter",
    "Alkupalat": "Förrätter",
    "Jälkiruoat": "Efterrätter", 
    "Juomat": "Drycker"
  }
};

export type CategoryLanguage = keyof typeof categoryTranslations;

// Get category translation
export const getCategoryTranslation = (
  category: string,
  language: CategoryLanguage = 'en'
): string => {
  if (!category) return "Other";
  
  const translations = categoryTranslations[language];
  const result = translations[category as keyof typeof translations] || category;
  return result;
};

// Get all category translations for a language
export const getCategoryTranslations = (language: CategoryLanguage = 'en') => {
  return categoryTranslations[language];
};
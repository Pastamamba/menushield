export const allergenTranslations = {
  en: {
    // EU 14 Allergens (Official)
    'gluten': 'Gluten',
    'dairy': 'Milk/Dairy',
    'eggs': 'Eggs',
    'fish': 'Fish',
    'crustaceans': 'Crustaceans',
    'shellfish': 'Crustaceans', // Legacy compatibility
    'nuts': 'Tree Nuts',
    'peanuts': 'Peanuts',
    'soy': 'Soy',
    'sesame': 'Sesame',
    'sulfites': 'Sulfites',
    'mustard': 'Mustard',
    'celery': 'Celery',
    'lupin': 'Lupin',
    'molluscs': 'Molluscs',
    
    // Additional Common Allergens
    'corn': 'Corn',
    'coconut': 'Coconut',
    'nightshades': 'Nightshades',
    'citrus': 'Citrus',
    'milk': 'Milk/Dairy', // Legacy support
    
    // Common Descriptions
    'contains': 'Contains',
    'mayContain': 'May contain',
    'allergenWarning': 'Allergen Warning',
    'autoCalculated': 'Auto-calculated from ingredients',
    'manuallySet': 'Manually set',
    'noAllergens': 'No allergens detected',
    'allergenInfo': 'Allergen Information',
    'detectedAllergens': 'Detected Allergens',
    'safeForYou': 'Safe for your allergens',
    'containsYourAllergens': 'Contains your allergens',
    'mayBeModifiable': 'May be modifiable',
  },
  
  sv: {
    // EU 14 Allergens (Swedish)
    'gluten': 'Gluten',
    'dairy': 'Mjölk/Mejeriprodukter',
    'eggs': 'Ägg',
    'fish': 'Fisk',
    'crustaceans': 'Kräftdjur',
    'shellfish': 'Kräftdjur', // Legacy compatibility
    'nuts': 'Nötter',
    'peanuts': 'Jordnötter',
    'soy': 'Soja',
    'sesame': 'Sesam',
    'sulfites': 'Sulfiter',
    'mustard': 'Senap',
    'celery': 'Selleri',
    'lupin': 'Lupin',
    'molluscs': 'Blötdjur',
    
    // Additional Common Allergens
    'corn': 'Majs',
    'coconut': 'Kokosnöt',
    'nightshades': 'Nattskatta',
    'citrus': 'Citrus',
    'milk': 'Mjölk/Mejeriprodukter', // Legacy support
    
    // Common Descriptions
    'contains': 'Innehåller',
    'mayContain': 'Kan innehålla',
    'allergenWarning': 'Allergenvarning',
    'autoCalculated': 'Automatiskt beräknat från ingredienser',
    'manuallySet': 'Manuellt inställt',
    'noAllergens': 'Inga allergener upptäckta',
    'allergenInfo': 'Allergeninformation',
    'detectedAllergens': 'Upptäckta Allergener',
    'safeForYou': 'Säker för dina allergener',
    'containsYourAllergens': 'Innehåller dina allergener',
    'mayBeModifiable': 'Kan vara modifierbar',
  },
  
  fi: {
    // EU 14 Allergens (Finnish)
    'gluten': 'Gluteeni',
    'dairy': 'Maito/Maitotuotteet',
    'eggs': 'Kananmuna',
    'fish': 'Kala',
    'shellfish': 'Äyriäiset',
    'nuts': 'Pähkinät',
    'peanuts': 'Maapähkinät',
    'soy': 'Soija',
    'sesame': 'Seesami',
    'sulfites': 'Sulfiitit',
    'mustard': 'Sinappi',
    'celery': 'Selleri',
    'lupin': 'Lupiini',
    'molluscs': 'Nilviäiset',
    
    // Additional Common Allergens
    'corn': 'Maissi',
    'coconut': 'Kookos',
    'nightshades': 'Koisokasvit',
    'citrus': 'Sitrushedelmät',
    'milk': 'Maito/Maitotuotteet', // Legacy support
    
    // Common Descriptions
    'contains': 'Sisältää',
    'mayContain': 'Saattaa sisältää',
    'allergenWarning': 'Allergeenivaroitus',
    'autoCalculated': 'Automaattisesti laskettu ainesosista',
    'manuallySet': 'Manuaalisesti asetettu',
    'noAllergens': 'Ei allergeeneja havaittu',
    'allergenInfo': 'Allergeeni-informaatio',
    'detectedAllergens': 'Havaitut Allergeenit',
    'safeForYou': 'Turvallinen allergeeneillesi',
    'containsYourAllergens': 'Sisältää allergeenisi',
    'mayBeModifiable': 'Voi olla muokattavissa',
  }
};

export type AllergenLanguage = keyof typeof allergenTranslations;
export type AllergenKey = keyof typeof allergenTranslations.en;

// Normalize allergen IDs (convert legacy terms to EU standard)
export const normalizeAllergenId = (id: string): string => {
  const normalizeMap: Record<string, string> = {
    'milk': 'dairy',
    'tree_nuts': 'nuts',
    'tree nuts': 'nuts',
    'shellfish': 'crustaceans', // Map legacy shellfish to EU term crustaceans
    'sulphites': 'sulfites',
  };
  
  return normalizeMap[id.toLowerCase()] || id.toLowerCase();
};

// Get allergen translation
export const getAllergenTranslation = (
  allergenId: string, 
  language: AllergenLanguage = 'en'
): string => {
  const normalizedId = normalizeAllergenId(allergenId);
  const translations = allergenTranslations[language];
  return translations[normalizedId as AllergenKey] || allergenId;
};

// Get all allergen translations for a specific language
export const getAllergenTranslations = (language: AllergenLanguage = 'en') => {
  return allergenTranslations[language];
};

// Get available languages
export const getAvailableAllergenLanguages = (): AllergenLanguage[] => {
  return Object.keys(allergenTranslations) as AllergenLanguage[];
};
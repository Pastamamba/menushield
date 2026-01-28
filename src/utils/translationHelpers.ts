// Translation utilities for displaying translated content from database
import type { Dish } from "../types";

// Interface for translated content structure in database
interface TranslatedContent {
  name: string;
  description?: string;
  confidence?: number;
  method?: string;
}

interface EntityTranslations {
  fi?: TranslatedContent;
  sv?: TranslatedContent;
  [key: string]: TranslatedContent | undefined;
}

interface DatabaseEntity {
  name: string;
  description?: string;
  translations?: string | EntityTranslations; // JSON string or parsed object
  translatedLanguages?: string | string[]; // JSON string or parsed array
}

// Get translated name for an entity (dish, ingredient, category)
export function getTranslatedName(
  entity: DatabaseEntity,
  language: string,
  fallback?: string
): string {
  // If language is English or no translation system, return original
  if (language === 'en') {
    return fallback || entity.name;
  }

  try {
    // Parse translations if it's a JSON string
    let translations: EntityTranslations = {};
    if (typeof entity.translations === 'string') {
      translations = JSON.parse(entity.translations);
    } else if (entity.translations) {
      translations = entity.translations;
    }

    // Check if we have translation for this language
    const translatedContent = translations[language];
    if (translatedContent?.name) {
      return translatedContent.name;
    }

    // Fallback to original name
    return fallback || entity.name;
  } catch (error) {
    console.warn('Error parsing translations for:', entity.name, error);
    return fallback || entity.name;
  }
}

// Get translated description for an entity
export function getTranslatedDescription(
  entity: DatabaseEntity,
  language: string,
  fallback?: string
): string | undefined {
  // If language is English, return original
  if (language === 'en') {
    return fallback || entity.description;
  }

  try {
    // Parse translations if it's a JSON string
    let translations: EntityTranslations = {};
    if (typeof entity.translations === 'string') {
      translations = JSON.parse(entity.translations);
    } else if (entity.translations) {
      translations = entity.translations;
    }

    // Check if we have translation for this language
    const translatedContent = translations[language];
    if (translatedContent?.description) {
      return translatedContent.description;
    }

    // Fallback to original description
    return fallback || entity.description;
  } catch (error) {
    console.warn('Error parsing translations for description:', entity.name, error);
    return fallback || entity.description;
  }
}

// Check if entity has translation for given language
export function hasTranslation(entity: DatabaseEntity, language: string): boolean {
  if (language === 'en') {
    return true; // English is always available (original)
  }

  try {
    // Parse translatedLanguages if it's a JSON string
    let translatedLanguages: string[] = [];
    if (typeof entity.translatedLanguages === 'string') {
      translatedLanguages = JSON.parse(entity.translatedLanguages);
    } else if (Array.isArray(entity.translatedLanguages)) {
      translatedLanguages = entity.translatedLanguages;
    }

    return translatedLanguages.includes(language);
  } catch (error) {
    console.warn('Error parsing translatedLanguages for:', entity.name, error);
    return false;
  }
}

// Get translation confidence for debugging/display
export function getTranslationConfidence(
  entity: DatabaseEntity,
  language: string
): number | undefined {
  if (language === 'en') {
    return 100; // Original is always 100% confidence
  }

  try {
    let translations: EntityTranslations = {};
    if (typeof entity.translations === 'string') {
      translations = JSON.parse(entity.translations);
    } else if (entity.translations) {
      translations = entity.translations;
    }

    return translations[language]?.confidence;
  } catch (error) {
    return undefined;
  }
}

// Get all available languages for entity
export function getAvailableLanguages(entity: DatabaseEntity): string[] {
  const languages = ['en']; // Always include English

  try {
    let translatedLanguages: string[] = [];
    if (typeof entity.translatedLanguages === 'string') {
      translatedLanguages = JSON.parse(entity.translatedLanguages);
    } else if (Array.isArray(entity.translatedLanguages)) {
      translatedLanguages = entity.translatedLanguages;
    }

    // Add translated languages (avoid duplicates)
    translatedLanguages.forEach(lang => {
      if (!languages.includes(lang)) {
        languages.push(lang);
      }
    });
  } catch (error) {
    console.warn('Error getting available languages for:', entity.name, error);
  }

  return languages;
}

// Dish-specific helper that works with Dish type
export function getDishTranslatedName(dish: Dish, language: string): string {
  return getTranslatedName(dish as any, language);
}

export function getDishTranslatedDescription(dish: Dish, language: string): string | undefined {
  return getTranslatedDescription(dish as any, language);
}

// Ingredient name translation helper
export function getIngredientTranslatedName(ingredient: any, language: string): string {
  if (typeof ingredient === 'string') {
    // If ingredient is just a string, return it as-is
    return ingredient;
  }
  
  return getTranslatedName(ingredient, language);
}

// Format translated content with confidence indicator for debug mode
export function formatTranslatedContent(
  entity: DatabaseEntity,
  language: string,
  showConfidence = false
): string {
  const translatedName = getTranslatedName(entity, language);
  
  if (!showConfidence || language === 'en') {
    return translatedName;
  }

  const confidence = getTranslationConfidence(entity, language);
  return confidence ? `${translatedName} (${confidence}%)` : translatedName;
}
import { useLanguage } from '../contexts/LanguageContext';

// System-wide translations for error messages, status texts, etc.
export function useSystemTranslations() {
  const { currentLanguage } = useLanguage();

  const translations = {
    restaurantNotFound: {
      en: 'Restaurant "{slug}" not found',
      fi: 'Ravintolaa "{slug}" ei löytynyt',
      sv: 'Restaurang "{slug}" hittades inte'
    },
    errorLoadingRestaurant: {
      en: 'Error loading restaurant',
      fi: 'Virhe ravintolan lataamisessa', 
      sv: 'Fel vid laddning av restaurang'
    },
    selectRestaurant: {
      en: 'Select restaurant',
      fi: 'Valitse ravintola',
      sv: 'Välj restaurang'
    },
    addNewRestaurant: {
      en: 'Add new restaurant',
      fi: 'Lisää uusi ravintola',
      sv: 'Lägg till ny restaurang'
    }
  };

  const t = (key: keyof typeof translations, params?: Record<string, string>): string => {
    const translation = translations[key];
    if (!translation) return key;
    
    let text = translation[currentLanguage as keyof typeof translation] || 
               translation.en || 
               key;
    
    // Replace parameters in the text
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, paramValue);
      });
    }
    
    return text;
  };

  return { t, currentLanguage };
}
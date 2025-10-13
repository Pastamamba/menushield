import { useLanguage } from '../contexts/LanguageContext';

// Simple translation utility for the guest menu
export function useMenuTranslations() {
  const { currentLanguage } = useLanguage();

  const translations = {
    filter: {
      en: 'Filter',
      fi: 'Suodata',
      sv: 'Filtrera'
    },
    filterMenu: {
      en: 'Filter menu',
      fi: 'Suodata menu',
      sv: 'Filtrera meny'
    },
    searchPlaceholder: {
      en: 'Search dishes...',
      fi: 'Etsi ruokia...',
      sv: 'Sök rätter...'
    },
    allergenWarning: {
      en: 'Select allergens you need to avoid',
      fi: 'Valitse allergeenit, joita haluat välttää',
      sv: 'Välj allergener du behöver undvika'
    },
    avoidingAllergens: {
      en: 'Avoiding',
      fi: 'Vältetään',
      sv: 'Undviker'
    },
    clearFilters: {
      en: 'Clear All',
      fi: 'Tyhjennä kaikki',
      sv: 'Rensa alla'
    },
    noDishesFound: {
      en: 'No dishes found',
      fi: 'Ruokia ei löytynyt',
      sv: 'Inga rätter hittades'
    },
    adjustFilters: {
      en: 'Try adjusting your search or allergen filters',
      fi: 'Kokeile muuttaa hakusanoja tai allergeenisuodattimia',
      sv: 'Prova att justera din sökning eller allergenfilter'
    },
    loadingMenu: {
      en: 'Loading menu...',
      fi: 'Ladataan menua...',
      sv: 'Laddar meny...'
    },
    errorLoading: {
      en: 'Error loading menu',
      fi: 'Virhe menun lataamisessa',
      sv: 'Fel vid laddning av meny'
    },
    tryAgain: {
      en: 'Try Again',
      fi: 'Yritä uudelleen',
      sv: 'Försök igen'
    },
    findSafeDishes: {
      en: 'Find safe dishes for yourself',
      fi: 'Löydä turvallisia ruokia itsellesi',
      sv: 'Hitta säkra rätter för dig själv'
    },
    showSafeDishes: {
      en: 'Show my safe dishes',
      fi: 'Näytä turvalliset ruokani',
      sv: 'Visa mina säkra rätter'
    }
  };

  const t = (key: keyof typeof translations): string => {
    const translation = translations[key];
    if (!translation) return key;
    
    return translation[currentLanguage as keyof typeof translation] || 
           translation.en || 
           key;
  };

  return { t, currentLanguage };
}
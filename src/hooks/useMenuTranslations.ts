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
    safeDining: {
      en: 'Safe dining for everyone',
      fi: 'Turvallista ruokailua kaikille',
      sv: 'Säker matupplevelse för alla'
    },
    showSafeDishes: {
      en: 'Show my safe dishes',
      fi: 'Näytä turvalliset ruokani',
      sv: 'Visa mina säkra rätter'
    },
    searchAllergens: {
      en: 'Search allergens...',
      fi: 'Etsi allergeeneja...',
      sv: 'Sök allergener...'
    },
    avoidingAllergensCount: {
      en: 'Avoiding allergens',
      fi: 'Vältät allergeeneja',
      sv: 'Undviker allergener'
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
    },
    restaurantNotFound: {
      en: 'Restaurant not found',
      fi: 'Ravintolaa ei löytynyt',
      sv: 'Restaurang hittades inte'
    },
    errorLoadingRestaurant: {
      en: 'Error loading restaurant',
      fi: 'Virhe ravintolan lataamisessa',
      sv: 'Fel vid laddning av restaurang'
    },
    showingModifiableOnly: {
      en: 'Showing Modifiable Dishes Only',
      fi: 'Näytetään vain muokattavissa olevat ruoat',
      sv: 'Visar endast modificerbara rätter'
    },
    modifiableDishesInfo: {
      en: 'These dishes may be modifiable. Please check with staff to confirm.',
      fi: 'Nämä ruoat saattavat olla muokattavissa. Tarkista henkilökunnalta.',
      sv: 'Dessa rätter kan vara modificerbara. Kontrollera med personalen.'
    },
    modifiableImportant: {
      en: 'Important: Ingredient modifications depend on kitchen capabilities and preparation methods. Always verify with restaurant staff before ordering.',
      fi: 'Tärkeää: Ainesten muokkaukset riippuvat keittiön mahdollisuuksista ja valmistustavoista. Varmista aina ravintolan henkilökunnalta ennen tilaamista.',
      sv: 'Viktigt: Ingrediensmodifieringar beror på kökets möjligheter och tillredningsmetoder. Kontrollera alltid med restaurangpersonalen innan beställning.'
    },
    allDishes: {
      en: 'All dishes',
      fi: 'Kaikki ruoat',
      sv: 'Alla rätter'
    },
    modifiableDishes: {
      en: 'Modifiable dishes',
      fi: 'Muokattavat ruoat',
      sv: 'Modificerbara rätter'
    },
    modifiableDishesHelp: {
      en: 'These dishes may be modifiable - please check with staff',
      fi: 'Nämä ruoat saattavat olla muokattavissa - kysy henkilökunnalta',
      sv: 'Dessa rätter kan vara modificerbara - fråga personalen'
    },
    selectAllergensHelp: {
      en: 'Select allergens to see safe options',
      fi: 'Valitse allergeenit nähdäksesi turvallisia vaihtoehtoja',
      sv: 'Välj allergener för att se säkra alternativ'
    },
    safeDishesTitle: {
      en: 'Safe dishes',
      fi: 'Turvalliset ruoat',
      sv: 'Säkra rätter'
    },
    warningDishesTitle: {
      en: 'Contains your allergens',
      fi: 'Sisältää allergeeneja',
      sv: 'Innehåller dina allergener'
    },
    warningDishesInfo: {
      en: '⚠️ These dishes contain your selected allergens. Ask the server if allergens can be modified or removed.',
      fi: '⚠️ Nämä ruoat sisältävät valitsemiasi allergeeneja. Kysy tarjoilijalta, voiko allergeeneja muokata tai poistaa.',
      sv: '⚠️ Dessa rätter innehåller dina valda allergener. Fråga servitören om allergener kan modifieras eller tas bort.'
    },
    showOnlyModifiable: {
      en: 'Show only modifiable dishes',
      fi: 'Näytä vain muokattavat ruoat',
      sv: 'Visa endast modificerbara rätter'
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
import { useLanguage } from "../contexts/LanguageContext";

// Simple translation utility for the guest menu
export function useMenuTranslations() {
  const { currentLanguage } = useLanguage();

  const translations = {
    filter: {
      en: "Filter",
      fi: "Suodata",
      sv: "Filtrera",
    },
    filterMenu: {
      en: "Filter menu",
      fi: "Suodata menu",
      sv: "Filtrera meny",
    },
    searchPlaceholder: {
      en: "Search dishes...",
      fi: "Etsi ruokia...",
      sv: "Sök rätter...",
    },
    allergenWarning: {
      en: "Select allergens you need to avoid",
      fi: "Valitse allergeenit, joita haluat välttää",
      sv: "Välj allergener du behöver undvika",
    },
    avoidingAllergens: {
      en: "Avoiding",
      fi: "Vältetään",
      sv: "Undviker",
    },
    clearFilters: {
      en: "Clear All",
      fi: "Tyhjennä kaikki",
      sv: "Rensa alla",
    },
    noDishesFound: {
      en: "No dishes found",
      fi: "Ruokia ei löytynyt",
      sv: "Inga rätter hittades",
    },
    adjustFilters: {
      en: "Try adjusting your search or allergen filters",
      fi: "Kokeile muuttaa hakusanoja tai allergeenisuodattimia",
      sv: "Prova att justera din sökning eller allergenfilter",
    },
    loadingMenu: {
      en: "Loading menu...",
      fi: "Ladataan menua...",
      sv: "Laddar meny...",
    },
    errorLoading: {
      en: "Error loading menu",
      fi: "Virhe menun lataamisessa",
      sv: "Fel vid laddning av meny",
    },
    tryAgain: {
      en: "Try Again",
      fi: "Yritä uudelleen",
      sv: "Försök igen",
    },
    findSafeDishes: {
      en: "Find safe dishes for yourself",
      fi: "Löydä turvallisia ruokia itsellesi",
      sv: "Hitta säkra rätter för dig själv",
    },
    safeDining: {
      en: "Safe dining for everyone",
      fi: "Turvallista ruokailua kaikille",
      sv: "Säker matupplevelse för alla",
    },
    showSafeDishes: {
      en: "Show dishes",
      fi: "Näytä ruoat",
      sv: "Visa rätter",
    },
    searchAllergens: {
      en: "Search allergens...",
      fi: "Etsi allergeeneja...",
      sv: "Sök allergener...",
    },
    searchIngredientsAllergens: {
      en: "Search ingredients, allergens...",
      fi: "Etsi aineksia, allergeeneja...",
      sv: "Sök ingredienser, allergener...",
    },
    avoidingAllergensCount: {
      en: "Avoiding allergens",
      fi: "Vältät allergeeneja",
      sv: "Undviker allergener",
    },
    selectRestaurant: {
      en: "Select restaurant",
      fi: "Valitse ravintola",
      sv: "Välj restaurang",
    },
    addNewRestaurant: {
      en: "Add new restaurant",
      fi: "Lisää uusi ravintola",
      sv: "Lägg till ny restaurang",
    },
    restaurantNotFound: {
      en: "Restaurant not found",
      fi: "Ravintolaa ei löytynyt",
      sv: "Restaurang hittades inte",
    },
    errorLoadingRestaurant: {
      en: "Error loading restaurant",
      fi: "Virhe ravintolan lataamisessa",
      sv: "Fel vid laddning av restaurang",
    },
    showingModifiableOnly: {
      en: "Showing Modifiable Dishes Only",
      fi: "Näytetään vain muokattavissa olevat ruoat",
      sv: "Visar endast modificerbara rätter",
    },
    modifiableDishesInfo: {
      en: "These dishes may be modifiable. Please check with staff to confirm.",
      fi: "Nämä ruoat saattavat olla muokattavissa. Tarkista henkilökunnalta.",
      sv: "Dessa rätter kan vara modificerbara. Kontrollera med personalen.",
    },
    modifiableImportant: {
      en: "Important: Ingredient modifications depend on kitchen capabilities and preparation methods. Always verify with restaurant staff before ordering.",
      fi: "Tärkeää: Ainesten muokkaukset riippuvat keittiön mahdollisuuksista ja valmistustavoista. Varmista aina ravintolan henkilökunnalta ennen tilaamista.",
      sv: "Viktigt: Ingrediensmodifieringar beror på kökets möjligheter och tillredningsmetoder. Kontrollera alltid med restaurangpersonalen innan beställning.",
    },
    allDishes: {
      en: "Dishes",
      fi: "Ruoat",
      sv: "Rätter",
    },
    modifiableDishes: {
      en: "Modifiable dishes",
      fi: "Muokattavat ruoat",
      sv: "Modificerbara rätter",
    },
    modifiableDishesHelp: {
      en: "These dishes may be modifiable - please check with staff",
      fi: "Nämä ruoat saattavat olla muokattavissa - kysy henkilökunnalta",
      sv: "Dessa rätter kan vara modificerbara - fråga personalen",
    },
    selectAllergensHelp: {
      en: "Select allergens to see safe options",
      fi: "Valitse allergeenit nähdäksesi turvallisia vaihtoehtoja",
      sv: "Välj allergener för att se säkra alternativ",
    },
    safeDishesTitle: {
      en: "Safe dishes",
      fi: "Turvalliset ruoat",
      sv: "Säkra rätter",
    },
    warningDishesTitle: {
      en: "Contains your allergens",
      fi: "Sisältää allergeeneja",
      sv: "Innehåller dina allergener",
    },
    warningDishesInfo: {
      en: "⚠️ These dishes contain your selected allergens. Ask the server if allergens can be modified or removed.",
      fi: "⚠️ Nämä ruoat sisältävät valitsemiasi allergeeneja. Kysy tarjoilijalta, voiko allergeeneja muokata tai poistaa.",
      sv: "⚠️ Dessa rätter innehåller dina valda allergener. Fråga servitören om allergener kan modifieras eller tas bort.",
    },
    saferMenuTitle: {
      en: "Safer menu",
      fi: "Turvallisempi menu",
      sv: "Säkrare meny",
    },
    hiddenDishesExplanation: {
      en: "We hide dishes that contain your selected allergens in required ingredients, as they cannot be made safe. You only see dishes that are safe or from which allergens can be removed.",
      fi: "Piilotamme ruoat jotka sisältävät valitsemiasi allergeeneja pakollisissa aineksissa, sillä niitä ei voida tehdä turvallisiksi. Näet vain ruoat jotka ovat turvallisia tai joista allergeenit voidaan poistaa.",
      sv: "Vi döljer rätter som innehåller dina valda allergener i obligatoriska ingredienser, eftersom de inte kan göras säkra. Du ser bara rätter som är säkra eller där allergener kan tas bort.",
    },
    showOnlyModifiable: {
      en: "Show only modifiable dishes",
      fi: "Näytä vain muokattavat ruoat",
      sv: "Visa endast modificerbara rätter",
    },
    // Allergen translations
    mandatoryAllergens: {
      en: "EU Mandatory Allergens",
      fi: "EU:n pakolliset allergeenit",
      sv: "EU:s obligatoriska allergener",
    },
    containsYourAllergens: {
      en: "Avoiding allergens",
      fi: "Välttää allergeeneja",
      sv: "Undviker allergener",
    },
    clearAll: {
      en: "Clear All",
      fi: "Tyhjennä kaikki",
      sv: "Rensa alla",
    },
    // Category translations
    category: {
      en: "Category",
      fi: "Kategoria",
      sv: "Kategori",
    },
    all: {
      en: "All",
      fi: "Kaikki",
      sv: "Alla",
    },
    // Header translations
    secureAllergenMenu: {
      en: "Secure Allergen Menu",
      fi: "Turvallinen allergeenimenu",
      sv: "Säker allergenmeny",
    },
    // Footer translations
    securePrivate: {
      en: "Secure & Private",
      fi: "Turvallinen ja yksityinen",
      sv: "Säker och privat",
    },
    verifiedIngredients: {
      en: "Verified Ingredients",
      fi: "Tarkastetut aineet",
      sv: "Verifierade ingredienser",
    },
    realTimeUpdates: {
      en: "Real-time Updates",
      fi: "Reaaliaikaiset päivitykset",
      sv: "Realtidsuppdateringar",
    },
    menuShieldHelps: {
      en: "MenuShield helps you dine safely. Information is provided by",
      fi: "MenuShield auttaa sinua ruokailemaan turvallisesti. Tiedot on toimittanut",
      sv: "MenuShield hjälper dig att äta säkert. Information tillhandahålls av",
    },
    andUpdatedRegularly: {
      en: "and updated regularly.",
      fi: "ja päivitetään säännöllisesti.",
      sv: "och uppdateras regelbundet.",
    },
    severeAllergiesWarning: {
      en: "For severe allergies, always confirm with restaurant staff. We prioritize your safety above all.",
      fi: "Vakavien allergioiden kohdalla varmista aina ravintolan henkilökunnalta. Turvallisuutesi on meille tärkeintä.",
      sv: "För allvarliga allergier, bekräfta alltid med restaurangpersonalen. Vi prioriterar din säkerhet framför allt.",
    },
    // Welcome message translations
    welcomeToAllergenMenu: {
      en: "Allergen-Safe Menu",
      fi: "Allergeeniturva menu",
      sv: "Allergensäker meny",
    },
    welcomeDescription: {
      en: "Select your allergens below to see only dishes that are safe for you. All ingredient information is carefully maintained and regularly updated.",
      fi: "Valitse allergeenisi alta nähdäksesi vain sinulle turvallisia ruokia. Kaikki ainestiedot pidetään huolellisesti yllä ja päivitetään säännöllisesti.",
      sv: "Välj dina allergener nedan för att se endast rätter som är säkra för dig. All ingrediensinformation underhålls noggrant och uppdateras regelbundet.",
    },
    informServerAboutAllergies: {
      en: "Always inform your server about severe allergies",
      fi: "Kerro aina tarjoilijalle vakavista allergioistasi",
      sv: "Informera alltid din servitör om allvarliga allergier",
    },
  };

  const t = (key: keyof typeof translations): string => {
    const translation = translations[key];
    if (!translation) return key;

    return (
      translation[currentLanguage as keyof typeof translation] ||
      translation.en ||
      key
    );
  };

  return { t, currentLanguage };
}

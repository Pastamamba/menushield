import { useLanguage } from '../contexts/LanguageContext';

// Admin-specific translations for admin panel, login, forms, etc.
export function useAdminTranslations() {
  const { currentLanguage } = useLanguage();

  const translations = {
    // Admin Panel
    adminPanel: {
      en: 'Admin Panel',
      fi: 'Hallintapaneeli',
      sv: 'Adminpanel'
    },
    adminLogin: {
      en: 'Admin Login',
      fi: 'Ylläpitäjän kirjautuminen',
      sv: 'Admin-inloggning'
    },
    createAccount: {
      en: 'Create your restaurant admin account',
      fi: 'Luo ravintolasi ylläpitäjätili',
      sv: 'Skapa ditt restaurang-adminskonto'
    },
    
    // Dish Management
    editDish: {
      en: 'Edit dish',
      fi: 'Muokkaa ruokaa',
      sv: 'Redigera rätt'
    },
    deleteDish: {
      en: 'Delete dish',
      fi: 'Poista ruoka',
      sv: 'Ta bort rätt'
    },
    deactivateDish: {
      en: 'Deactivate dish',
      fi: 'Poista ruoka käytöstä',
      sv: 'Inaktivera rätt'
    },
    activateDish: {
      en: 'Activate dish',
      fi: 'Ota ruoka käyttöön',
      sv: 'Aktivera rätt'
    },
    mainCourse: {
      en: 'Main Course',
      fi: 'Pääruoka',
      sv: 'Huvudrätt'
    },
    sideDish: {
      en: 'Side Dish',
      fi: 'Lisuke',
      sv: 'Tillbehör'
    },
    
    // Forms
    email: {
      en: 'Email',
      fi: 'Sähköposti',
      sv: 'E-post'
    },
    password: {
      en: 'Password',
      fi: 'Salasana',
      sv: 'Lösenord'
    },
    login: {
      en: 'Login',
      fi: 'Kirjaudu',
      sv: 'Logga in'
    },
    logout: {
      en: 'Logout',
      fi: 'Kirjaudu ulos',
      sv: 'Logga ut'
    },
    signUp: {
      en: 'Sign Up',
      fi: 'Rekisteröidy',
      sv: 'Registrera dig'
    },
    
    // Navigation
    dashboard: {
      en: 'Dashboard',
      fi: 'Hallintapaneeli',
      sv: 'Instrumentpanel'
    },
    dishes: {
      en: 'Dishes',
      fi: 'Ruokalajit',
      sv: 'Rätter'
    },
    qrCode: {
      en: 'QR Code',
      fi: 'QR-koodi',
      sv: 'QR-kod'
    },
    settings: {
      en: 'Settings',
      fi: 'Asetukset',
      sv: 'Inställningar'
    },
    
    // Restaurant
    restaurantName: {
      en: 'Restaurant Name',
      fi: 'Ravintolan nimi',
      sv: 'Restaurangnamn'
    },
    
    // Common actions
    save: {
      en: 'Save',
      fi: 'Tallenna',
      sv: 'Spara'
    },
    cancel: {
      en: 'Cancel',
      fi: 'Peruuta',
      sv: 'Avbryt'
    },
    delete: {
      en: 'Delete',
      fi: 'Poista',
      sv: 'Ta bort'
    },
    edit: {
      en: 'Edit',
      fi: 'Muokkaa',
      sv: 'Redigera'
    },
    add: {
      en: 'Add',
      fi: 'Lisää',
      sv: 'Lägg till'
    },
    
    // Status messages
    loading: {
      en: 'Loading...',
      fi: 'Ladataan...',
      sv: 'Laddar...'
    },
    error: {
      en: 'Error',
      fi: 'Virhe',
      sv: 'Fel'
    },
    success: {
      en: 'Success',
      fi: 'Onnistui',
      sv: 'Framgång'
    },
    
    // Login/Signup flow
    noAccount: {
      en: "Don't have an account?",
      fi: 'Ei tiliä?',
      sv: 'Har du inget konto?'
    },
    signUpHere: {
      en: 'Sign up here',
      fi: 'Rekisteröidy tässä',
      sv: 'Registrera dig här'
    },
    haveAccount: {
      en: 'Already have an account?',
      fi: 'Onko sinulla jo tili?',
      sv: 'Har du redan ett konto?'
    },
    loginHere: {
      en: 'Login here',
      fi: 'Kirjaudu tässä',
      sv: 'Logga in här'
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
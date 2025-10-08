// Language context for managing user's preferred language
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, isValidLanguageCode } from '../utils/multilingual';
import type { LanguageCode } from '../utils/multilingual';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  availableLanguages: LanguageCode[];
  setAvailableLanguages: (languages: LanguageCode[]) => void;
  getLanguageDisplayName: (language: LanguageCode) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: LanguageCode;
  supportedLanguages?: LanguageCode[];
}

export function LanguageProvider({ 
  children, 
  defaultLanguage = 'en', 
  supportedLanguages = ['en'] 
}: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(defaultLanguage);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>(supportedLanguages);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('menushield-language');
    if (savedLanguage && isValidLanguageCode(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Auto-detect browser language
      const browserLanguage = navigator.language.toLowerCase();
      const supportedLanguage = availableLanguages.find(lang => 
        browserLanguage.startsWith(lang) || browserLanguage === lang
      );
      if (supportedLanguage) {
        setCurrentLanguage(supportedLanguage);
      }
    }
  }, [availableLanguages]);

  const setLanguage = (language: LanguageCode) => {
    if (availableLanguages.includes(language)) {
      setCurrentLanguage(language);
      localStorage.setItem('menushield-language', language);
      
      // Update document language and direction
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const getLanguageDisplayName = (language: LanguageCode): string => {
    return SUPPORTED_LANGUAGES[language]?.nativeName || language;
  };

  const isRTL = currentLanguage === 'ar';

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages,
    setAvailableLanguages,
    getLanguageDisplayName,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for getting translated content
export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  return {
    currentLanguage,
    t: (key: string, fallback: string = key) => {
      // This could be extended to use a proper translation system
      // For now, it returns the fallback
      return fallback;
    }
  };
}
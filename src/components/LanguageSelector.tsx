// Language selector component for the guest menu
import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../utils/multilingual';
import type { LanguageCode } from '../utils/multilingual';

interface LanguageSelectorProps {
  className?: string;
  showFlags?: boolean;
  variant?: 'dropdown' | 'buttons' | 'compact';
}

export default function LanguageSelector({ 
  className = '',
  showFlags = true,
  variant = 'dropdown'
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (availableLanguages.length <= 1) {
    return null; // Don't show selector if only one language is available
  }

  const handleLanguageChange = (language: LanguageCode) => {
    setLanguage(language);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
          aria-label="Select language"
        >
          {showFlags && (
            <span className="text-lg">
              {SUPPORTED_LANGUAGES[currentLanguage]?.flag || '🌐'}
            </span>
          )}
          <span className="text-xs uppercase font-medium">
            {currentLanguage}
          </span>
          <svg 
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
            {availableLanguages.map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageChange(language)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage === language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {showFlags && (
                  <span className="text-base">
                    {SUPPORTED_LANGUAGES[language]?.flag || '🌐'}
                  </span>
                )}
                <span className="text-left">
                  {getLanguageDisplayName(language)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {availableLanguages.map((language) => (
          <button
            key={language}
            onClick={() => handleLanguageChange(language)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              currentLanguage === language
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
            }`}
          >
            {showFlags && (
              <span className="text-sm">
                {SUPPORTED_LANGUAGES[language]?.flag || '🌐'}
              </span>
            )}
            <span className="uppercase font-medium">
              {language}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Select language"
      >
        {showFlags && (
          <span className="text-lg">
            {SUPPORTED_LANGUAGES[currentLanguage]?.flag || '🌐'}
          </span>
        )}
        <span>{getLanguageDisplayName(currentLanguage)}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-full">
          {availableLanguages.map((language) => (
            <button
              key={language}
              onClick={() => handleLanguageChange(language)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                currentLanguage === language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {showFlags && (
                <span className="text-lg">
                  {SUPPORTED_LANGUAGES[language]?.flag || '🌐'}
                </span>
              )}
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {getLanguageDisplayName(language)}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {language}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook to close dropdown when clicking outside
export function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void) {
  const handleClick = (e: Event) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  });
}
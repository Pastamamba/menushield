// Admin component for managing restaurant language settings
import { useState, useEffect } from 'react';
import { useRestaurant } from '../utils/restaurantApi';
import { SUPPORTED_LANGUAGES } from '../utils/multilingual';
import type { LanguageCode } from '../utils/multilingual';

interface LanguageSettingsProps {
  className?: string;
}

export default function LanguageSettings({ className = '' }: LanguageSettingsProps) {
  const { data: restaurant, isLoading } = useRestaurant();
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageCode[]>(['en']);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (restaurant) {
      setDefaultLanguage((restaurant.defaultLanguage as LanguageCode) || 'en');
      
      try {
        const parsed = JSON.parse(restaurant.supportedLanguages || '["en"]');
        setSupportedLanguages(parsed.filter((lang: string) => lang in SUPPORTED_LANGUAGES));
      } catch (error) {
        setSupportedLanguages(['en']);
      }
    }
  }, [restaurant]);

  const handleLanguageToggle = (language: LanguageCode) => {
    setSupportedLanguages(prev => {
      if (prev.includes(language)) {
        // Don't allow removing the default language
        if (language === defaultLanguage) {
          setMessage({ type: 'error', text: 'Cannot remove the default language. Change the default first.' });
          return prev;
        }
        return prev.filter(lang => lang !== language);
      } else {
        return [...prev, language].sort();
      }
    });
  };

  const handleDefaultLanguageChange = (language: LanguageCode) => {
    setDefaultLanguage(language);
    // Ensure the default language is in supported languages
    if (!supportedLanguages.includes(language)) {
      setSupportedLanguages(prev => [...prev, language].sort());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/restaurant/language-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_language: defaultLanguage,
          supported_languages: JSON.stringify(supportedLanguages),
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Language settings updated successfully!' });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update language settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguageStats = () => {
    return {
      totalSupported: supportedLanguages.length,
      coverage: Math.round((supportedLanguages.length / Object.keys(SUPPORTED_LANGUAGES).length) * 100),
      regions: Array.from(new Set(supportedLanguages.map(lang => {
        // Group by region
        if (['en'].includes(lang)) return 'English';
        if (['sv', 'no', 'da', 'fi'].includes(lang)) return 'Nordic';
        if (['de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru'].includes(lang)) return 'European';
        if (['zh', 'zh-tw', 'ja', 'ko'].includes(lang)) return 'East Asian';
        if (['ar', 'hi', 'tr'].includes(lang)) return 'Other';
        return 'Other';
      }))).length
    };
  };

  const stats = getLanguageStats();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Language Settings</h2>
            <p className="text-sm text-gray-600">
              Configure which languages your menu supports for international guests
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Supporting {stats.totalSupported} languages</div>
            <div>{stats.coverage}% coverage • {stats.regions} regions</div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSupported}</div>
            <div className="text-sm text-blue-600">Languages</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.coverage}%</div>
            <div className="text-sm text-green-600">Coverage</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.regions}</div>
            <div className="text-sm text-purple-600">Regions</div>
          </div>
        </div>

        {/* Default Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Language
          </label>
          <select
            value={defaultLanguage}
            onChange={(e) => handleDefaultLanguageChange(e.target.value as LanguageCode)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.flag} {info.nativeName} ({info.name})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This will be the primary language for your menu and admin interface
          </p>
        </div>

        {/* Supported Languages */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Supported Languages
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => {
              const isSupported = supportedLanguages.includes(code as LanguageCode);
              const isDefault = code === defaultLanguage;
              
              return (
                <label
                  key={code}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSupported
                      ? isDefault
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSupported}
                    onChange={() => handleLanguageToggle(code as LanguageCode)}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <span className="text-lg mr-3">{info.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {info.nativeName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {info.name}
                      </div>
                    </div>
                    {isDefault && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {isSupported && !isDefault && (
                      <div className="ml-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected languages will be available to your guests. You can add translations later.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || supportedLanguages.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSaving ? 'Saving...' : 'Save Language Settings'}
          </button>
        </div>
      </div>

      {/* Quick Setup Tips */}
      <div className="border-t bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Quick Setup Tips</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Start with languages your staff speaks for better customer service</li>
          <li>• Nordic languages (Swedish, Norwegian, Danish) have high tourist overlap</li>
          <li>• Adding Chinese and English covers most international tourists</li>
          <li>• You can always add more languages later as your business grows</li>
        </ul>
      </div>
    </div>
  );
}
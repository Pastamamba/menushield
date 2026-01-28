import { useState, useEffect } from "react";
import {
  COMMON_ALLERGENS,
  ALL_ALLERGENS,
} from "../utils/dishAnalyzer";
import { useMenuTranslations } from '../hooks/useMenuTranslations';
import { getAllergenTranslation } from '../utils/allergenTranslations';

// Mobile haptic feedback helper
const handleTouchFeedback = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

interface AllergenFilterProps {
  avoid?: string[];
  setAvoid?: (allergens: string[]) => void;
  selectedAllergens?: string[];
  onAllergenToggle?: (allergen: string) => void;
  onSelectionChange?: (allergens: string[]) => void; // Add this prop for compatibility
  isMobile?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
}

export default function AllergenFilter({
  avoid = [],
  setAvoid,
  selectedAllergens = [],
  onAllergenToggle,
  onSelectionChange,
  isMobile = false,
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Search ingredients, allergens...",
}: AllergenFilterProps) {
  const { t, currentLanguage } = useMenuTranslations();
  const [ingredientsFromAPI, setIngredientsFromAPI] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch ingredients from API
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        // Use current language parameter to get translated ingredients
        const response = await fetch(`/api/ingredients?lang=${currentLanguage}`);
        if (response.ok) {
          const ingredients = await response.json();
          setIngredientsFromAPI(ingredients);
        }
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
      }
    };
    fetchIngredients();
  }, [currentLanguage]);

  // Search through ingredients when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Search allergens first - include both English and translated names
    const matchingAllergens = ALL_ALLERGENS.filter(allergen => {
      const englishName = allergen.name.toLowerCase();
      const translatedName = getAllergenTranslation(allergen.id, currentLanguage as any).toLowerCase();
      const allergerId = allergen.id.toLowerCase();
      
      return englishName.includes(searchLower) ||
             translatedName.includes(searchLower) ||
             allergerId.includes(searchLower);
    });

    // Search ingredients from API - search both translated name and original English name
    const matchingIngredients = ingredientsFromAPI
      .filter(ingredient => {
        const translatedName = ingredient.name.toLowerCase();
        const searchTerm = searchLower;
        
        // Search in the translated name
        if (translatedName.includes(searchTerm)) {
          return true;
        }
        
        // Search in original English name from translations field
        if (ingredient.translations) {
          try {
            const translations = typeof ingredient.translations === 'string' 
              ? JSON.parse(ingredient.translations) 
              : ingredient.translations;
            
            // Try to find the original English name
            let originalName = '';
            if (translations.name?.en) {
              originalName = translations.name.en;
            } else if (translations.en?.name) {
              originalName = translations.en.name;
            }
            
            if (originalName && originalName.toLowerCase().includes(searchTerm)) {
              return true;
            }
            
            // Also search in all available translations
            for (const lang in translations) {
              if (typeof translations[lang] === 'object' && translations[lang].name) {
                if (translations[lang].name.toLowerCase().includes(searchTerm)) {
                  return true;
                }
              } else if (typeof translations[lang] === 'string' && translations[lang].toLowerCase().includes(searchTerm)) {
                return true;
              }
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        
        return false;
      })
      .slice(0, 10) // Limit to first 10 results
      .map(ingredient => ({
        id: ingredient.name, // Use actual ingredient name as ID
        name: ingredient.name, // Use translated name for display
        color: "gray",
        type: "ingredient"
      }));

    const finalResults = [
      ...matchingAllergens.map(a => ({ ...a, type: "allergen" })),
      ...matchingIngredients
    ];
    
    setSearchResults(finalResults);
  }, [searchTerm, ingredientsFromAPI, currentLanguage]);

  // Use new props if available, fallback to old props
  const currentAllergens = onAllergenToggle ? selectedAllergens : avoid;
  
  const handleToggle = (allergen: string) => {
    handleTouchFeedback(); // Add haptic feedback
    
    if (onAllergenToggle) {
      onAllergenToggle(allergen);
    } else if (onSelectionChange) {
      const newAllergens = currentAllergens.includes(allergen)
        ? currentAllergens.filter(a => a !== allergen)
        : [...currentAllergens, allergen];
      onSelectionChange(newAllergens);
    } else if (setAvoid) {
      const newAllergens = currentAllergens.includes(allergen)
        ? currentAllergens.filter(a => a !== allergen)
        : [...currentAllergens, allergen];
      setAvoid(newAllergens);
    }
  };
// Show common allergens always (never change the 14 boxes)
  const displayAllergens = COMMON_ALLERGENS;

  const toggleAllergen = (allergenId: string) => {
    handleToggle(allergenId);
  };

  const isSelected = (allergenId: string) => currentAllergens.includes(allergenId);

  // Mobile version with better UX
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Search Input - Mobile */}
        {onSearchChange && (
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            
            {/* Search Results Dropdown - Mobile */}
            {searchTerm.trim() && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => {
                  const isIngredient = result.type === "ingredient";
                  const isAlreadySelected = isSelected(result.id);
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        toggleAllergen(result.id);
                        // Clear search when selecting from dropdown
                        if (onSearchChange) {
                          onSearchChange('');
                        }
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                        isAlreadySelected ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {result.type === "allergen" 
                            ? getAllergenTranslation(result.id, currentLanguage as any)
                            : result.name.charAt(0).toUpperCase() + result.name.slice(1)
                          }
                        </span>
                        {isIngredient && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">ingredient</span>
                        )}
                      </div>
                      {isAlreadySelected && (
                        <span className={`text-xs ${isIngredient ? 'text-blue-600' : 'text-red-600'}`}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Allergen Grid - Mobile Optimized with refined styling */}
        <div className="grid grid-cols-2 gap-2">
          {displayAllergens.map((allergen) => {
            const selected = isSelected(allergen.id);
            return (
              <button
                key={allergen.id}
                onClick={() => toggleAllergen(allergen.id)}
                className={`
                  relative p-2.5 rounded-md text-left transition-all duration-200 active:scale-95 min-h-[40px] flex items-center
                  ${
                    selected
                      ? "bg-red-500 text-white shadow-sm border border-red-600"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-medium text-xs ${
                      selected ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {getAllergenTranslation(allergen.id, currentLanguage as any)}
                  </span>
                  {selected && (
                    <svg
                      className="w-3.5 h-3.5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {currentAllergens.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-800 text-xs">
                Avoiding {currentAllergens.length} allergen{currentAllergens.length !== 1 ? 's' : ''}
              </h4>
              <button
                onClick={() => {
                  if (onAllergenToggle) {
                    // Clear by toggling each selected allergen off
                    currentAllergens.forEach((allergen) => onAllergenToggle(allergen));
                  } else if (setAvoid) {
                    setAvoid([]);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                {t('clearAll') || 'Clear All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentAllergens.map((allergenId) => {
                const allergen = ALL_ALLERGENS.find((a) => a.id === allergenId);
                return allergen ? (
                  <span
                    key={allergenId}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium"
                  >
                    <span>{getAllergenTranslation(allergen.id, currentLanguage as any)}</span>
                    <button
                      onClick={() => toggleAllergen(allergenId)}
                      className="text-red-600 hover:text-red-800 ml-0.5 w-3 h-3 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input - Desktop */}
      {onSearchChange && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          
          {/* Search Results Dropdown - Desktop */}
          {searchTerm.trim() && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result) => {
                const isIngredient = result.type === "ingredient";
                const isAlreadySelected = isSelected(result.id);
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      toggleAllergen(result.id);
                      // Clear search when selecting from dropdown
                      if (onSearchChange) {
                        onSearchChange('');
                      }
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                      isAlreadySelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {result.type === "allergen" 
                          ? getAllergenTranslation(result.id, currentLanguage as any)
                          : result.name.charAt(0).toUpperCase() + result.name.slice(1)
                        }
                      </span>
                      {isIngredient && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">ingredient</span>
                      )}
                    </div>
                    {isAlreadySelected && (
                      <span className={`text-xs ${isIngredient ? 'text-blue-600' : 'text-red-600'}`}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* EU Mandatory Allergens Title */}
      <div className="text-sm font-medium text-gray-800 mb-2">
        {t('mandatoryAllergens') || 'EU Mandatory Allergens'}
      </div>
      
      {/* Compact Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {displayAllergens.map((allergen) => {
          const selected = isSelected(allergen.id);
          return (
            <button
              key={allergen.id}
              onClick={() => toggleAllergen(allergen.id)}
              className={`
                p-3 rounded-md border transition-all duration-200 text-left min-h-[40px] flex items-center active:scale-95
                ${
                  selected
                    ? "border-red-500 bg-red-50 text-red-800"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-xs">{getAllergenTranslation(allergen.id, currentLanguage as any)}</span>
                {selected && (
                  <span className="ml-2 text-xs text-red-600">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Allergens Summary */}
      {currentAllergens.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-red-800">
              {t('containsYourAllergens') || `Avoiding allergens`} ({currentAllergens.length})
            </h4>
            <button
              onClick={() => {
                if (onAllergenToggle) {
                  // Clear by toggling each selected allergen off
                  currentAllergens.forEach((allergen) => onAllergenToggle(allergen));
                } else if (setAvoid) {
                  setAvoid([]);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              {t('clearAll') || 'Clear All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentAllergens.map((allergenId) => {
              // Check if it's an allergen first
              let allergen = ALL_ALLERGENS.find((a) => a.id === allergenId);
              let isIngredient = false;
              
              // If not found in allergens, it might be an ingredient name
              if (!allergen) {
                const ingredient = ingredientsFromAPI.find(ing => ing.name === allergenId);
                if (ingredient) {
                  allergen = { id: ingredient.name, name: ingredient.name, color: "gray", type: "ingredient" };
                  isIngredient = true;
                }
              }
              
              return allergen ? (
                <span
                  key={allergenId}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                    isIngredient ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span>{isIngredient ? allergen.name.charAt(0).toUpperCase() + allergen.name.slice(1) : allergen.name}</span>
                  {isIngredient && <span className="text-xs bg-blue-200 text-blue-600 px-1 rounded">ingredient</span>}
                  <button
                    onClick={() => toggleAllergen(allergenId)}
                    className="text-red-600 hover:text-red-800 ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

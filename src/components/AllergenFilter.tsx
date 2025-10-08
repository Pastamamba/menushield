import { useState } from "react";
import {
  COMMON_ALLERGENS,
  ALL_ALLERGENS,
  searchAllergens,
} from "../utils/dishAnalyzer";

interface AllergenFilterProps {
  avoid?: string[];
  setAvoid?: (allergens: string[]) => void;
  selectedAllergens?: string[];
  onAllergenToggle?: (allergen: string) => void;
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  isMobile?: boolean;
}

export default function AllergenFilter({
  avoid = [],
  setAvoid,
  selectedAllergens = [],
  onAllergenToggle,
  searchTerm = "",
  onSearchChange,
  isMobile = false,
}: AllergenFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Use new props if available, fallback to old props
  const currentAllergens = onAllergenToggle ? selectedAllergens : avoid;
  const handleToggle = onAllergenToggle || ((allergen: string) => {
    if (setAvoid) {
      const newAllergens = currentAllergens.includes(allergen)
        ? currentAllergens.filter(a => a !== allergen)
        : [...currentAllergens, allergen];
      setAvoid(newAllergens);
    }
  });
  const currentSearchTerm = searchTerm || searchQuery;
  const handleSearchChange = onSearchChange || setSearchQuery;

  const searchResults = searchAllergens(currentSearchTerm);
  const displayAllergens = currentSearchTerm ? searchResults : COMMON_ALLERGENS;

  const toggleAllergen = (allergenId: string) => {
    handleToggle(allergenId);
  };

  const isSelected = (allergenId: string) => currentAllergens.includes(allergenId);

  // Mobile version with better UX
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search allergens..."
            value={currentSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
          />
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Allergen Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          {displayAllergens.map((allergen) => {
            const selected = isSelected(allergen.id);
            return (
              <button
                key={allergen.id}
                onClick={() => toggleAllergen(allergen.id)}
                className={`
                  relative p-4 rounded-xl text-left transition-all duration-200 active:scale-95
                  ${selected 
                    ? 'bg-red-500 text-white shadow-lg border-2 border-red-600' 
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${selected ? 'text-white' : 'text-gray-900'}`}>
                      {allergen.name}
                    </div>
                  </div>
                  {selected && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {currentAllergens.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-red-800">
                Avoiding {currentAllergens.length} allergen{currentAllergens.length !== 1 ? 's' : ''}
              </h4>
              <button
                onClick={() => {
                  if (onAllergenToggle) {
                    // Clear by toggling each selected allergen off
                    currentAllergens.forEach(allergen => onAllergenToggle(allergen));
                  } else if (setAvoid) {
                    setAvoid([]);
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentAllergens.map((allergenId) => {
                const allergen = ALL_ALLERGENS.find((a) => a.id === allergenId);
                return allergen ? (
                  <span
                    key={allergenId}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    <span>{allergen.name}</span>
                    <button
                      onClick={() => toggleAllergen(allergenId)}
                      className="text-red-600 hover:text-red-800 ml-1"
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
    <div className="space-y-4">
      {/* Always Visible Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search allergens..."
          value={currentSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
        />
        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {currentSearchTerm && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Compact Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {displayAllergens.map((allergen) => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 text-left
              ${
                isSelected(allergen.id)
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{allergen.name}</span>
              {isSelected(allergen.id) && (
                <span className="text-xs text-red-600">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Allergens Summary */}
      {currentAllergens.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-800">
              Currently Avoiding ({currentAllergens.length})
            </h4>
            <button
              onClick={() => {
                if (onAllergenToggle) {
                  // Clear by toggling each selected allergen off
                  currentAllergens.forEach(allergen => onAllergenToggle(allergen));
                } else if (setAvoid) {
                  setAvoid([]);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentAllergens.map((allergenId) => {
              const allergen = ALL_ALLERGENS.find((a) => a.id === allergenId);
              return allergen ? (
                <span
                  key={allergenId}
                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs"
                >
                  <span>{allergen.name}</span>
                  <button
                    onClick={() => toggleAllergen(allergenId)}
                    className="text-red-600 hover:text-red-800 ml-1"
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

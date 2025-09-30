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
}

export default function AllergenFilter({
  avoid = [],
  setAvoid,
  selectedAllergens = [],
  onAllergenToggle,
  searchTerm = "",
  onSearchChange,
}: AllergenFilterProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use new props if available, fallback to old props
  const currentAllergens = selectedAllergens.length > 0 ? selectedAllergens : avoid;
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
  const displayAllergens = showSearch ? searchResults : COMMON_ALLERGENS;

  const toggleAllergen = (allergenId: string) => {
    handleToggle(allergenId);
  };

  const isSelected = (allergenId: string) => currentAllergens.includes(allergenId);

  return (
    <div className="space-y-3">
      {/* Compact Common Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {displayAllergens.map((allergen) => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={`
              p-2 rounded-lg border-2 transition-all duration-200 text-left
              ${
                isSelected(allergen.id)
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{allergen.icon}</span>
              <span className="font-medium text-sm">{allergen.name}</span>
              {isSelected(allergen.id) && (
                <span className="text-xs text-red-600">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Compact Search Toggle and Search Box */}
      {!showSearch ? (
        <div className="text-center">
          <button
            onClick={() => setShowSearch(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            🔍 Search more
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search allergens..."
              value={currentSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                handleSearchChange("");
              }}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm"
            >
              ✕
            </button>
          </div>

          {searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-gray-500 text-center">
              No allergens found
            </p>
          )}
        </div>
      )}

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
                  <span>{allergen.icon}</span>
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

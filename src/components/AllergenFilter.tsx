import { useState } from "react";
import {
  COMMON_ALLERGENS,
  ALL_ALLERGENS,
  searchAllergens,
} from "../utils/dishAnalyzer";

interface AllergenFilterProps {
  avoid: string[];
  setAvoid: (allergens: string[]) => void;
}

export default function AllergenFilter({
  avoid,
  setAvoid,
}: AllergenFilterProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = searchAllergens(searchQuery);
  const displayAllergens = showSearch ? searchResults : COMMON_ALLERGENS;

  const toggleAllergen = (allergenId: string) => {
    if (avoid.includes(allergenId)) {
      setAvoid(avoid.filter((id) => id !== allergenId));
    } else {
      setAvoid([...avoid, allergenId]);
    }
  };

  const isSelected = (allergenId: string) => avoid.includes(allergenId);

  return (
    <div className="space-y-4">
      {/* Common Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{allergen.icon}</span>
              <span className="font-medium text-sm">{allergen.name}</span>
            </div>
            {isSelected(allergen.id) && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <span>✓</span>
                <span>Avoiding</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Search Toggle and Search Box */}
      {!showSearch ? (
        <div className="text-center">
          <button
            onClick={() => setShowSearch(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            🔍 Search for more allergens
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search allergens (e.g. lupin, molluscs)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              No allergens found matching "{searchQuery}"
            </p>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to common allergens
            </button>
          </div>
        </div>
      )}

      {/* Selected Allergens Summary */}
      {avoid.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-800">
              Currently Avoiding ({avoid.length})
            </h4>
            <button
              onClick={() => setAvoid([])}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {avoid.map((allergenId) => {
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

import {
  COMMON_ALLERGENS,
  ALL_ALLERGENS,
} from "../utils/dishAnalyzer";
import { useMenuTranslations } from '../hooks/useMenuTranslations';

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
}

export default function AllergenFilter({
  avoid = [],
  setAvoid,
  selectedAllergens = [],
  onAllergenToggle,
  onSelectionChange,
  isMobile = false,
}: AllergenFilterProps) {
  const { t } = useMenuTranslations();

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
// Show common allergens always
  const displayAllergens = COMMON_ALLERGENS;

  const toggleAllergen = (allergenId: string) => {
    handleToggle(allergenId);
  };

  const isSelected = (allergenId: string) => currentAllergens.includes(allergenId);

  // Mobile version with better UX
  if (isMobile) {
    return (
      <div className="space-y-3">
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
                    {allergen.name}
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
                Vältetään {currentAllergens.length} allergeenia
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
                Tyhjennä
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
                    <span>{allergen.name}</span>
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
      {/* Compact Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {displayAllergens.map((allergen) => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={`
              p-3 rounded-md border transition-all duration-200 text-left min-h-[40px] flex items-center active:scale-95
              ${
                isSelected(allergen.id)
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
              }
            `}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-xs">{allergen.name}</span>
              {isSelected(allergen.id) && (
                <span className="text-red-600 ml-2 text-xs">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Allergens Summary */}
      {currentAllergens.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-red-800">
              Vältetään allergeeneja ({currentAllergens.length})
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
              Tyhjennä kaikki
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentAllergens.map((allergenId) => {
              const allergen = ALL_ALLERGENS.find((a) => a.id === allergenId);
              return allergen ? (
                <span
                  key={allergenId}
                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
                >
                  <span>{allergen.name}</span>
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

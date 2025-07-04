import React from "react";

// Expanded allergen options to match our dish management system
const ALLERGEN_OPTIONS = [
  { id: "dairy", name: "Dairy", color: "#3B82F6", icon: "🥛" },
  { id: "gluten", name: "Gluten", color: "#F59E0B", icon: "🌾" },
  { id: "nuts", name: "Nuts", color: "#8B5CF6", icon: "🥜" },
  { id: "peanuts", name: "Peanuts", color: "#EF4444", icon: "🥜" },
  { id: "shellfish", name: "Shellfish", color: "#06B6D4", icon: "🦐" },
  { id: "fish", name: "Fish", color: "#10B981", icon: "🐟" },
  { id: "eggs", name: "Eggs", color: "#F97316", icon: "🥚" },
  { id: "soy", name: "Soy", color: "#84CC16", icon: "🫘" },
  { id: "sesame", name: "Sesame", color: "#A855F7", icon: "🌰" },
];

interface Props {
  avoid: string[];
  setAvoid: React.Dispatch<React.SetStateAction<string[]>>;
}

const AllergenFilter: React.FC<Props> = ({ avoid, setAvoid }) => {
  const toggle = (allergenId: string) => {
    setAvoid((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ALLERGEN_OPTIONS.map((allergen) => (
        <button
          key={allergen.id}
          onClick={() => toggle(allergen.id)}
          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 ${
            avoid.includes(allergen.id)
              ? "text-white border-transparent shadow-md"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
          style={{
            backgroundColor: avoid.includes(allergen.id)
              ? allergen.color
              : undefined,
          }}
        >
          <span className="text-lg">{allergen.icon}</span>
          <span className="font-medium text-sm">{allergen.name}</span>
        </button>
      ))}
    </div>
  );
};

export default AllergenFilter;

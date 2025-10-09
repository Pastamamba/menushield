// Enhanced Guest Menu with multilingual support
import { useState, useEffect, useRef } from "react";
import { useMenu } from "../utils/dishApi";
import { useRestaurant } from "../utils/restaurantApi";
import AllergenFilter from "../components/AllergenFilter";
import DishCard from "./DishCard";
import LanguageSelector from "./LanguageSelector";
import { analyzeDishSafety } from "../utils/dishAnalyzer";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslatedDish, getTranslatedIngredientName, getTranslatedAllergenName } from "../utils/multilingual";
import type { Dish } from "../types";

export default function GuestMenuMultilingual() {
  const { data: dishes = [], isLoading, error } = useMenu();
  const { data: restaurant } = useRestaurant();
  const { currentLanguage } = useLanguage();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Close mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileFilter && !(event.target as Element).closest('[data-drawer="mobile-filter"]')) {
        setShowMobileFilter(false);
      }
    };

    if (showMobileFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileFilter]);

  const scrollToMenu = () => {
    setShowMobileFilter(false);
    setTimeout(() => {
      if (menuSectionRef.current) {
        const headerHeight = document.querySelector('.mobile-header')?.clientHeight || 80;
        const targetPosition = menuSectionRef.current.offsetTop - headerHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 300);
  };

  // Filter dishes based on search term (now searches in current language)
  const filteredDishes = dishes.filter(dish => {
    const translatedDish = getTranslatedDish(dish, currentLanguage);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      translatedDish.name.toLowerCase().includes(searchLower) ||
      translatedDish.description.toLowerCase().includes(searchLower) ||
      (dish.ingredients || []).some(ingredient => 
        getTranslatedIngredientName({ name: ingredient } as any, currentLanguage)
          .toLowerCase().includes(searchLower)
      )
    );
  });

  // Analyze dish safety and categorize
  const analyzedDishes = filteredDishes.map(dish => ({
    dish,
    safety: analyzeDishSafety(dish, selectedAllergens)
  }));

  const safeDishes = analyzedDishes.filter(({ safety }) => safety.status === "safe");
  const modifiableDishes = analyzedDishes.filter(({ safety }) => safety.status === "modifiable");
  const unsafeDishes = analyzedDishes.filter(({ safety }) => safety.status === "unsafe");

  // Group dishes by category with translations
  const categorizeDishesByType = (dishData: typeof analyzedDishes) => {
    const categories = new Map<string, typeof analyzedDishes>();
    
    dishData.forEach(item => {
      const category = item.dish.category || "Other";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(item);
    });
    
    return Array.from(categories.entries());
  };

  const getLocalizedText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'heading': {
        'en': 'Restaurant Menu',
        'sv': 'Restaurangmeny',
        'no': 'Restaurantmeny',
        'da': 'Restaurantmenu',
        'de': 'Restaurantmenü',
        'fr': 'Menu du restaurant',
        'es': 'Menú del restaurante',
        'it': 'Menu del ristorante',
        'zh': '餐厅菜单',
        'ja': 'レストランメニュー',
        'ko': '레스토랑 메뉴',
        'ar': 'قائمة المطعم',
        'hi': 'रेस्तराँ मेनू',
      },
      'safe_dishes': {
        'en': 'Safe Dishes',
        'sv': 'Säkra rätter',
        'no': 'Trygge retter',
        'da': 'Sikre retter',
        'de': 'Sichere Gerichte',
        'fr': 'Plats sûrs',
        'es': 'Platos seguros',
        'it': 'Piatti sicuri',
        'zh': '安全菜品',
        'ja': '安全な料理',
        'ko': '안전한 요리',
        'ar': 'أطباق آمنة',
        'hi': 'सुरक्षित व्यंजन',
      },
      'modifiable_dishes': {
        'en': 'Modifiable Dishes',
        'sv': 'Anpassningsbara rätter',
        'no': 'Tilpassbare retter',
        'da': 'Tilpasselige retter',
        'de': 'Anpassbare Gerichte',
        'fr': 'Plats modifiables',
        'es': 'Platos modificables',
        'it': 'Piatti modificabili',
        'zh': '可调整菜品',
        'ja': '調整可能な料理',
        'ko': '수정 가능한 요리',
        'ar': 'أطباق قابلة للتعديل',
        'hi': 'संशोधित व्यंजन',
      },
      'contains_allergens': {
        'en': 'Contains Allergens',
        'sv': 'Innehåller allergener',
        'no': 'Inneholder allergener',
        'da': 'Indeholder allergener',
        'de': 'Enthält Allergene',
        'fr': 'Contient des allergènes',
        'es': 'Contiene alérgenos',
        'it': 'Contiene allergeni',
        'zh': '含过敏原',
        'ja': 'アレルゲン含有',
        'ko': '알레르겐 포함',
        'ar': 'يحتوي على مسببات الحساسية',
        'hi': 'एलर्जेन युक्त',
      },
      'search_placeholder': {
        'en': 'Search dishes, ingredients...',
        'sv': 'Sök rätter, ingredienser...',
        'no': 'Søk retter, ingredienser...',
        'da': 'Søg retter, ingredienser...',
        'de': 'Gerichte, Zutaten suchen...',
        'fr': 'Rechercher plats, ingrédients...',
        'es': 'Buscar platos, ingredientes...',
        'it': 'Cerca piatti, ingredienti...',
        'zh': '搜索菜品、配料...',
        'ja': '料理、食材を検索...',
        'ko': '요리, 재료 검색...',
        'ar': 'البحث عن الأطباق والمكونات...',
        'hi': 'व्यंजन, सामग्री खोजें...',
      },
      'no_dishes_found': {
        'en': 'No dishes found matching your criteria.',
        'sv': 'Inga rätter hittades som matchar dina kriterier.',
        'no': 'Ingen retter funnet som matcher dine kriterier.',
        'da': 'Ingen retter fundet, der matcher dine kriterier.',
        'de': 'Keine Gerichte gefunden, die Ihren Kriterien entsprechen.',
        'fr': 'Aucun plat trouvé correspondant à vos critères.',
        'es': 'No se encontraron platos que coincidan con sus criterios.',
        'it': 'Nessun piatto trovato che corrisponda ai tuoi criteri.',
        'zh': '未找到符合您条件的菜品。',
        'ja': '条件に一致する料理が見つかりませんでした。',
        'ko': '기준에 맞는 요리를 찾을 수 없습니다.',
        'ar': 'لم يتم العثور على أطباق تطابق معاييرك.',
        'hi': 'आपके मानदंडों से मेल खाने वाले कोई व्यंजन नहीं मिले।',
      }
    };

    return translations[key]?.[currentLanguage] || translations[key]?.['en'] || key;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-blue-300 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{getLocalizedText('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error loading menu</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const DishSection = ({ 
    title, 
    dishes, 
    count, 
    colorClass 
  }: { 
    title: string; 
    dishes: typeof analyzedDishes; 
    count: number;
    colorClass: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${colorClass}`}>
          {title}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass.includes('green') 
          ? 'bg-green-100 text-green-800' 
          : colorClass.includes('yellow') 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-red-100 text-red-800'
        }`}>
          {count} {count === 1 ? 'dish' : 'dishes'}
        </span>
      </div>
      
      {dishes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {getLocalizedText('no_dishes_found')}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map(({ dish, safety }) => (
            <DishCard
              key={dish.id}
              dish={dish}
              safetyStatus={safety}
              showPrices={restaurant?.showPrices !== false}
              currency={restaurant?.currency || 'EUR'}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with language selector */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 mobile-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {restaurant?.name || getLocalizedText('heading')}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language selector */}
              <LanguageSelector variant="compact" />
              
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilter(true)}
                className="md:hidden flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                Filter
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <AllergenFilter
                selectedAllergens={selectedAllergens}
                onSelectionChange={setSelectedAllergens}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={getLocalizedText('search_placeholder')}
              />
            </div>
          </div>

          {/* Menu Content */}
          <div className="lg:col-span-3" ref={menuSectionRef}>
            {selectedAllergens.length === 0 && !searchTerm ? (
              // Show all dishes when no filters applied
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dishes.map(dish => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      safetyStatus={{ status: "safe", allergens: [] }}
                      showPrices={restaurant?.showPrices !== false}
                      currency={restaurant?.currency || 'EUR'}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Show categorized results when filters applied
              <div className="space-y-12">
                <DishSection
                  title={getLocalizedText('safe_dishes')}
                  dishes={safeDishes}
                  count={safeDishes.length}
                  colorClass="text-green-700"
                />
                
                <DishSection
                  title={getLocalizedText('modifiable_dishes')}
                  dishes={modifiableDishes}
                  count={modifiableDishes.length}
                  colorClass="text-yellow-700"
                />
                
                <DishSection
                  title={getLocalizedText('contains_allergens')}
                  dishes={unsafeDishes}
                  count={unsafeDishes.length}
                  colorClass="text-red-700"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl max-h-[80vh] overflow-hidden"
            data-drawer="mobile-filter"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Filter Menu</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <AllergenFilter
                selectedAllergens={selectedAllergens}
                onSelectionChange={setSelectedAllergens}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={getLocalizedText('search_placeholder')}
              />
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={scrollToMenu}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Show Results ({filteredDishes.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
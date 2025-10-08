// Enhanced App.tsx with multilingual support
import React, { useEffect, useState } from 'react';
import AllergenFilter from './components/AllergenFilter';
import LanguageSelector from './components/LanguageSelector';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import type { Dish } from './types';

// Main app component with language support
const AppContent: React.FC = () => {
    const [menu, setMenu] = useState<Dish[]>([]);
    const [avoid, setAvoid] = useState<string[]>([]);
    const { currentLanguage } = useLanguage();

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json() as Promise<Dish[]>)
            .then(data => setMenu(data));
    }, []);

    // Helper function to get translated dish name
    const getTranslatedDishName = (dish: Dish): string => {
        if (!dish.translations) return dish.name;
        
        try {
            const translations = JSON.parse(dish.translations);
            return translations[currentLanguage]?.name || dish.name;
        } catch {
            return dish.name;
        }
    };

    // Helper function to get translated modification note
    const getTranslatedModificationNote = (dish: Dish): string => {
        if (!dish.modification_note) return '';
        if (!dish.translations) return dish.modification_note;
        
        try {
            const translations = JSON.parse(dish.translations);
            return translations[currentLanguage]?.modificationNote || dish.modification_note;
        } catch {
            return dish.modification_note;
        }
    };

    // Filter dishes based on allergens
    const safeDishes = menu.filter(
        d => !d.allergen_tags.some((tag: string) => avoid.includes(tag))
    );
    const modifiableDishes = menu.filter(
        d =>
            d.allergen_tags.some((tag: string) => avoid.includes(tag)) &&
            Boolean(d.modification_note)
    );

    // Get localized text based on current language
    const getLocalizedText = (key: string): string => {
        const translations: Record<string, Record<string, string>> = {
            'title': {
                'en': 'MenuShield',
                'sv': 'MenuShield',
                'no': 'MenuShield', 
                'da': 'MenuShield',
                'de': 'MenuShield',
                'zh': '菜单防护',
                'ja': 'メニューシールド',
            },
            'select_allergens': {
                'en': 'Select Allergens to Avoid',
                'sv': 'Välj allergener att undvika',
                'no': 'Velg allergener å unngå',
                'da': 'Vælg allergener at undgå',
                'de': 'Allergene zum Vermeiden auswählen',
                'zh': '选择要避免的过敏原',
                'ja': '避けるべきアレルゲンを選択',
            },
            'safe_dishes': {
                'en': 'Safe Dishes',
                'sv': 'Säkra rätter',
                'no': 'Trygge retter',
                'da': 'Sikre retter',
                'de': 'Sichere Gerichte',
                'zh': '安全菜品',
                'ja': '安全な料理',
            },
            'modifiable_dishes': {
                'en': 'Dishes You Can Modify',
                'sv': 'Rätter du kan anpassa',
                'no': 'Retter du kan tilpasse',
                'da': 'Retter du kan tilpasse',
                'de': 'Gerichte, die Sie anpassen können',
                'zh': '可调整的菜品',
                'ja': '調整可能な料理',
            },
            'no_matches': {
                'en': 'No safe or modifiable dishes found for your filters.',
                'sv': 'Inga säkra eller anpassningsbara rätter hittades för dina filter.',
                'no': 'Ingen trygge eller tilpassbare retter funnet for dine filtre.',
                'da': 'Ingen sikre eller tilpasselige retter fundet for dine filtre.',
                'de': 'Keine sicheren oder anpassbaren Gerichte für Ihre Filter gefunden.',
                'zh': '未找到符合您筛选条件的安全或可调整菜品。',
                'ja': 'フィルターに一致する安全または調整可能な料理が見つかりませんでした。',
            },
            'clear_filters': {
                'en': 'Clear Filters',
                'sv': 'Rensa filter',
                'no': 'Fjern filtre',
                'da': 'Ryd filtre',
                'de': 'Filter löschen',
                'zh': '清除筛选',
                'ja': 'フィルターをクリア',
            }
        };

        return translations[key]?.[currentLanguage] || translations[key]?.['en'] || key;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-green-600">
                        {getLocalizedText('title')}
                    </h1>
                    {/* Language selector in header */}
                    <LanguageSelector variant="compact" />
                </div>
            </header>
            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Allergen Picker */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        {getLocalizedText('select_allergens')}
                    </h2>
                    <AllergenFilter avoid={avoid} setAvoid={setAvoid} />
                </section>

                {/* Safe Dishes */}
                {safeDishes.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            {getLocalizedText('safe_dishes')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {safeDishes.map(d => (
                                <div
                                    key={d.id}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-green-200"
                                >
                                    <span className="text-lg font-semibold text-green-700">
                                        {getTranslatedDishName(d)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Modifiable Dishes */}
                {modifiableDishes.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            {getLocalizedText('modifiable_dishes')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {modifiableDishes.map(d => (
                                <div
                                    key={d.id}
                                    className="bg-yellow-50 rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-yellow-200 flex flex-col"
                                >
                                    <span className="text-lg font-semibold text-yellow-800 mb-2">
                                        {getTranslatedDishName(d)}
                                    </span>
                                    <span className="mt-auto text-sm italic text-yellow-900">
                                        {getTranslatedModificationNote(d)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* No matches */}
                {safeDishes.length + modifiableDishes.length === 0 && (
                    <section className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            {getLocalizedText('no_matches')}
                        </p>
                        <button
                            onClick={() => setAvoid([])}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-300"
                        >
                            {getLocalizedText('clear_filters')}
                        </button>
                    </section>
                )}
            </main>
        </div>
    );
};

// Main app wrapper with language provider
const App: React.FC = () => {
    return (
        <LanguageProvider 
            defaultLanguage="en" 
            supportedLanguages={['en', 'sv', 'no', 'da', 'de', 'zh', 'ja']}
        >
            <AppContent />
        </LanguageProvider>
    );
};

export default App;
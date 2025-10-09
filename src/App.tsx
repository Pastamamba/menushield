import React, { useEffect, useState } from 'react';
import AllergenFilter from './components/AllergenFilter';
import type { Dish } from './types';

const App: React.FC = () => {
    const [menu, setMenu] = useState<Dish[]>([]);
    const [avoid, setAvoid] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json() as Promise<Dish[]>)
            .then(data => setMenu(data));
    }, []);

    const safeDishes = menu.filter(
        d => !d.allergen_tags.some((tag: string) => avoid.includes(tag))
    );
    const modifiableDishes = menu.filter(
        d =>
            d.allergen_tags.some((tag: string) => avoid.includes(tag)) &&
            Boolean(d.modification_note)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-3xl font-extrabold text-green-600">MenuShield</h1>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Allergen Picker */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Select Allergens to Avoid
                    </h2>
                    <AllergenFilter avoid={avoid} setAvoid={setAvoid} />
                </section>

                {/* Safe Dishes */}
                {safeDishes.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold mb-3">Safe Dishes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {safeDishes.map(d => (
                                <div
                                    key={d.id}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-green-200"
                                >
                  <span className="text-lg font-semibold text-green-700">
                    {d.name}
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
                            Dishes You Can Modify
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {modifiableDishes.map(d => (
                                <div
                                    key={d.id}
                                    className="bg-yellow-50 rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-yellow-200 flex flex-col"
                                >
                  <span className="text-lg font-semibold text-yellow-800 mb-2">
                    {d.name}
                  </span>
                                    <span className="mt-auto text-sm italic text-yellow-900">
                    {d.modification_note}
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
                            No safe or modifiable dishes found for your filters.
                        </p>
                        <button
                            onClick={() => setAvoid([])}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-300"
                        >
                            Clear Filters
                        </button>
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;

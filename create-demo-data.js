// Quick script to add demo restaurant and dishes to fix empty database
import fs from 'fs';

console.log('📊 Creating demo data for MenuShield...');

// Demo restaurant data
const demoRestaurant = {
  id: '1',
  name: 'Demo Restaurant',
  slug: 'demo-restaurant',
  description: 'A family-friendly restaurant committed to safe dining for all',
  defaultLanguage: 'en',
  supportedLanguages: ['en'],
  showPrices: true,
  currency: 'EUR',
  contact: '(555) 123-4567',
  isActive: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Read existing dishes from backend/data/menu.json
const dishesData = JSON.parse(fs.readFileSync('./backend/data/menu.json', 'utf8'));

// Transform dishes for our structure
const demoDishes = dishesData.slice(0, 10).map((dish, index) => ({
  id: dish.id,
  restaurantId: '1',
  name: dish.name,
  description: dish.description,
  price: dish.price,
  category: dish.category,
  ingredients: JSON.stringify(dish.ingredients),
  allergenTags: JSON.stringify(dish.allergen_tags || []),
  modificationNote: dish.modification_note,
  isModifiable: dish.is_modifiable || false,
  isActive: true,
  displayOrder: index + 1,
  imageUrl: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

// Write to backend/db/ files for immediate use
fs.writeFileSync('./backend/db/restaurant.json', JSON.stringify({
  ...demoRestaurant
}, null, 2));

fs.writeFileSync('./backend/db/dishes.json', JSON.stringify(demoDishes, null, 2));

console.log('✅ Demo data created!');
console.log('📍 Restaurant: Demo Restaurant (slug: demo-restaurant)');
console.log('🍽️ Dishes:', demoDishes.length);
console.log('🌐 URL: http://localhost:5173/r/demo-restaurant');

// Also update restaurant.json to include slug
const restaurantData = JSON.parse(fs.readFileSync('./backend/db/restaurant.json', 'utf8'));
restaurantData.slug = 'demo-restaurant';
restaurantData.defaultLanguage = 'en';
restaurantData.showPrices = true;
restaurantData.currency = 'EUR';

fs.writeFileSync('./backend/db/restaurant.json', JSON.stringify(restaurantData, null, 2));

console.log('🚀 Ready to go! Start backend and frontend.');
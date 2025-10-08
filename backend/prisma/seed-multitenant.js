import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

/**
 * Multi-tenant Seed Script for MenuShield
 * 
 * This script creates initial data for the new multi-tenant architecture
 * including demo restaurants, admin users, and sample menus.
 */

async function seedMultiTenantData() {
  console.log('🌱 Seeding multi-tenant MenuShield database...');
  
  try {
    // Clear existing data (for fresh start)
    console.log('🧹 Clearing existing data...');
    await prisma.dishIngredient.deleteMany({});
    await prisma.dish.deleteMany({});
    await prisma.ingredient.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.allergenTranslation.deleteMany({});

    // Create allergen translations (global)
    console.log('🌍 Creating allergen translations...');
    await createAllergenTranslations();

    // Create demo restaurants
    console.log('🏢 Creating demo restaurants...');
    const restaurants = await createDemoRestaurants();

    // Create sample data for each restaurant
    for (const restaurant of restaurants) {
      console.log(`📋 Creating sample data for ${restaurant.name}...`);
      await createSampleData(restaurant);
    }

    console.log('🎉 Multi-tenant database seeded successfully!');
    console.log('📊 Summary:');
    
    const stats = {
      restaurants: await prisma.restaurant.count(),
      users: await prisma.user.count(),
      dishes: await prisma.dish.count(),
      ingredients: await prisma.ingredient.count(),
      categories: await prisma.category.count(),
    };
    
    console.log(JSON.stringify(stats, null, 2));
    
    // Print login credentials
    console.log('\n🔑 Demo Login Credentials:');
    for (const restaurant of restaurants) {
      console.log(`${restaurant.name} (${restaurant.slug}):`);
      console.log(`  URL: /menu/${restaurant.slug}`);
      console.log(`  Admin: admin@${restaurant.slug}.com`);
      console.log(`  Password: demo123`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createAllergenTranslations() {
  const allergenTranslations = [
    {
      allergenKey: 'dairy',
      translations: JSON.stringify({
        en: { name: 'Dairy', description: 'Contains milk or milk products' },
        fi: { name: 'Maito', description: 'Sisältää maitoa tai maitotuotteita' },
        sv: { name: 'Mjölk', description: 'Innehåller mjölk eller mjölkprodukter' },
        de: { name: 'Milch', description: 'Enthält Milch oder Milchprodukte' },
        fr: { name: 'Lait', description: 'Contient du lait ou des produits laitiers' }
      })
    },
    {
      allergenKey: 'gluten',
      translations: JSON.stringify({
        en: { name: 'Gluten', description: 'Contains wheat, rye, barley or oats' },
        fi: { name: 'Gluteeni', description: 'Sisältää vehnää, ruista, ohraa tai kauraa' },
        sv: { name: 'Gluten', description: 'Innehåller vete, råg, korn eller havre' },
        de: { name: 'Gluten', description: 'Enthält Weizen, Roggen, Gerste oder Hafer' },
        fr: { name: 'Gluten', description: 'Contient du blé, seigle, orge ou avoine' }
      })
    },
    {
      allergenKey: 'nuts',
      translations: JSON.stringify({
        en: { name: 'Nuts', description: 'Contains tree nuts' },
        fi: { name: 'Pähkinät', description: 'Sisältää pähkinöitä' },
        sv: { name: 'Nötter', description: 'Innehåller nötter' },
        de: { name: 'Nüsse', description: 'Enthält Nüsse' },
        fr: { name: 'Noix', description: 'Contient des noix' }
      })
    },
    {
      allergenKey: 'eggs',
      translations: JSON.stringify({
        en: { name: 'Eggs', description: 'Contains eggs' },
        fi: { name: 'Munat', description: 'Sisältää munia' },
        sv: { name: 'Ägg', description: 'Innehåller ägg' },
        de: { name: 'Eier', description: 'Enthält Eier' },
        fr: { name: 'Œufs', description: 'Contient des œufs' }
      })
    },
    {
      allergenKey: 'soy',
      translations: JSON.stringify({
        en: { name: 'Soy', description: 'Contains soy products' },
        fi: { name: 'Soija', description: 'Sisältää soijatuotteita' },
        sv: { name: 'Soja', description: 'Innehåller sojaprodukter' },
        de: { name: 'Soja', description: 'Enthält Sojaprodukte' },
        fr: { name: 'Soja', description: 'Contient des produits à base de soja' }
      })
    },
    {
      allergenKey: 'fish',
      translations: JSON.stringify({
        en: { name: 'Fish', description: 'Contains fish' },
        fi: { name: 'Kala', description: 'Sisältää kalaa' },
        sv: { name: 'Fisk', description: 'Innehåller fisk' },
        de: { name: 'Fisch', description: 'Enthält Fisch' },
        fr: { name: 'Poisson', description: 'Contient du poisson' }
      })
    }
  ];

  for (const allergen of allergenTranslations) {
    await prisma.allergenTranslation.create({ data: allergen });
  }
}

async function createDemoRestaurants() {
  const restaurantData = [
    {
      name: 'MenuShield Demo Restaurant',
      slug: 'menushield-demo',
      description: 'A safe dining experience for everyone with comprehensive allergen information',
      contact: '+358 9 1234 5678',
      website: 'https://menushield.com',
      address: 'Esplanadi 1, 00100 Helsinki, Finland',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'fi', 'sv', 'de', 'fr']),
      subscriptionTier: 'enterprise',
      timezone: 'Europe/Helsinki',
    },
    {
      name: 'Bella Italia',
      slug: 'bella-italia',
      description: 'Authentic Italian cuisine with allergen-safe options',
      contact: '+358 9 2345 6789',
      website: 'https://bella-italia.fi',
      address: 'Via Roma 123, 00100 Helsinki, Finland',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'it', 'fi']),
      subscriptionTier: 'premium',
      timezone: 'Europe/Helsinki',
    },
    {
      name: 'Sushi Zen',
      slug: 'sushi-zen',
      description: 'Fresh sushi and Japanese dishes with detailed allergen information',
      contact: '+358 40 987 6543',
      website: 'https://sushi-zen.fi',
      address: 'Sakura Street 45, 00100 Helsinki, Finland',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'ja', 'fi']),
      subscriptionTier: 'premium',
      timezone: 'Europe/Helsinki',
    },
    {
      name: 'Green Garden',
      slug: 'green-garden',
      description: 'Plant-based restaurant with comprehensive allergen information',
      contact: '+358 50 555 0123',
      website: 'https://green-garden.fi',
      address: 'Green Street 78, 00100 Helsinki, Finland',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'fi', 'sv', 'de']),
      subscriptionTier: 'free',
      timezone: 'Europe/Helsinki',
    }
  ];

  const restaurants = [];
  for (const data of restaurantData) {
    const restaurant = await prisma.restaurant.create({
      data: {
        ...data,
        isActive: true,
        showPrices: true,
      }
    });
    restaurants.push(restaurant);

    // Create admin user for each restaurant
    const adminEmail = `admin@${data.slug}.com`;
    const hashedPassword = await bcrypt.hash('demo123', 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'OWNER',
        isActive: true,
        restaurantId: restaurant.id,
      }
    });
  }

  return restaurants;
}

async function createSampleData(restaurant) {
  // Create categories
  const categories = await createCategoriesForRestaurant(restaurant.id);
  
  // Create ingredients
  const ingredients = await createIngredientsForRestaurant(restaurant.id, categories);
  
  // Create dishes
  await createDishesForRestaurant(restaurant.id, categories, ingredients);
}

async function createCategoriesForRestaurant(restaurantId) {
  const categoryData = [
    {
      name: 'Proteins',
      description: 'Meat, fish, and plant-based proteins',
      color: '#ef4444',
      icon: '🍖',
      displayOrder: 1,
    },
    {
      name: 'Vegetables',
      description: 'Fresh vegetables and herbs',
      color: '#22c55e',
      icon: '🥬',
      displayOrder: 2,
    },
    {
      name: 'Grains & Cereals',
      description: 'Wheat, rice, oats and other grains',
      color: '#f59e0b',
      icon: '🌾',
      displayOrder: 3,
    },
    {
      name: 'Dairy & Eggs',
      description: 'Milk products and eggs',
      color: '#3b82f6',
      icon: '🥛',
      displayOrder: 4,
    }
  ];

  const categories = [];
  for (const data of categoryData) {
    const category = await prisma.category.create({
      data: {
        ...data,
        restaurantId,
        isActive: true,
      }
    });
    categories.push(category);
  }

  return categories;
}

async function createIngredientsForRestaurant(restaurantId, categories) {
  const ingredientData = [
    {
      name: 'Chicken Breast',
      categoryId: categories.find(c => c.name === 'Proteins')?.id,
      allergenTags: JSON.stringify([]),
    },
    {
      name: 'Salmon',
      categoryId: categories.find(c => c.name === 'Proteins')?.id,
      allergenTags: JSON.stringify(['fish']),
    },
    {
      name: 'Wheat Flour',
      categoryId: categories.find(c => c.name === 'Grains & Cereals')?.id,
      allergenTags: JSON.stringify(['gluten']),
    },
    {
      name: 'Mozzarella Cheese',
      categoryId: categories.find(c => c.name === 'Dairy & Eggs')?.id,
      allergenTags: JSON.stringify(['dairy']),
    },
    {
      name: 'Fresh Tomatoes',
      categoryId: categories.find(c => c.name === 'Vegetables')?.id,
      allergenTags: JSON.stringify([]),
    },
    {
      name: 'Basil',
      categoryId: categories.find(c => c.name === 'Vegetables')?.id,
      allergenTags: JSON.stringify([]),
    }
  ];

  const ingredients = [];
  for (const data of ingredientData) {
    const ingredient = await prisma.ingredient.create({
      data: {
        ...data,
        restaurantId,
        isActive: true,
      }
    });
    ingredients.push(ingredient);
  }

  return ingredients;
}

async function createDishesForRestaurant(restaurantId, categories, ingredients) {
  const dishData = [
    {
      name: 'Signature Special',
      description: 'Our restaurant\'s signature dish with carefully selected ingredients',
      price: 24.50,
      allergenTags: JSON.stringify(['dairy']),
      isModifiable: true,
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      modificationNote: 'Can be made dairy-free upon request',
      categoryId: categories[0]?.id,
    },
    {
      name: 'Safe Garden Salad',
      description: 'Fresh mixed greens with safe, allergen-free dressing',
      price: 16.00,
      allergenTags: JSON.stringify([]),
      isModifiable: false,
      isActive: true,
      isFeatured: false,
      displayOrder: 2,
      categoryId: categories[1]?.id,
    },
    {
      name: 'Classic Pasta',
      description: 'Traditional pasta dish with our special sauce',
      price: 18.50,
      allergenTags: JSON.stringify(['gluten', 'dairy']),
      isModifiable: true,
      isActive: true,
      isFeatured: false,
      displayOrder: 3,
      modificationNote: 'Available in gluten-free version',
      categoryId: categories[2]?.id,
    }
  ];

  for (const data of dishData) {
    await prisma.dish.create({
      data: {
        ...data,
        restaurantId,
      }
    });
  }
}

// Run seeding if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedMultiTenantData()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedMultiTenantData };
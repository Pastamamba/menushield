import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MongoDB seed...');

  // Check if demo restaurant already exists
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-restaurant' }
  });

  if (existingRestaurant) {
    console.log('✅ Demo restaurant already exists, skipping seed...');
    console.log('🚀 Server starting with existing data!');
    return; // Exit early if restaurant exists
  }

  // Clean existing data (in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.dishIngredient.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();
  }

  // Create demo restaurant
  console.log('🏪 Creating demo restaurant...');
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      description: 'A family-friendly restaurant committed to safe dining for all',
      contact: '(555) 123-4567',
      defaultLanguage: 'en',
      supportedLanguages: '["en"]',
      showPrices: true,
      currency: 'EUR',
    },
  });

  console.log(`✅ Restaurant created: ${restaurant.name} (${restaurant.slug})`);

  // Create admin user (check if exists first)
  console.log('👤 Creating admin user...');
  
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@demo-restaurant.com' }
  });

  let adminUser;
  if (existingUser) {
    console.log('✅ Admin user already exists');
    adminUser = existingUser;
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@demo-restaurant.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'OWNER',
        restaurantId: restaurant.id,
      },
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
  }

  // Create categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Main Course',
        description: 'Hearty main dishes',
        color: 'bg-red-100 text-red-800',
        displayOrder: 1,
        restaurantId: restaurant.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Appetizers',
        description: 'Light starters',
        color: 'bg-green-100 text-green-800',
        displayOrder: 2,
        restaurantId: restaurant.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Desserts',
        description: 'Sweet endings',
        color: 'bg-purple-100 text-purple-800',
        displayOrder: 3,
        restaurantId: restaurant.id,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create ingredients
  console.log('🥬 Creating ingredients...');
  const ingredients = await Promise.all([
    prisma.ingredient.create({
      data: {
        name: 'Pizza Dough',
        allergenTags: '["gluten"]',
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Mozzarella Cheese',
        allergenTags: '["dairy"]',
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Tomato Sauce',
        allergenTags: '[]',
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Fresh Basil',
        allergenTags: '[]',
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${ingredients.length} ingredients`);

  // Create dishes
  console.log('🍽️ Creating dishes...');
  const dishes = [
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
      price: 16.99,
      categoryId: categories[0].id,
      allergenTags: '["gluten", "dairy"]',
      isModifiable: false,
      displayOrder: 1,
    },
    {
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan, croutons, and caesar dressing',
      price: 12.99,
      categoryId: categories[1].id,
      allergenTags: '["dairy", "eggs", "gluten"]',
      isModifiable: true,
      modificationNote: 'Can be made without croutons and parmesan',
      displayOrder: 2,
    },
    {
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with chocolate frosting',
      price: 8.99,
      categoryId: categories[2].id,
      allergenTags: '["gluten", "dairy", "eggs"]',
      isModifiable: false,
      displayOrder: 3,
    },
    {
      name: 'Grilled Chicken',
      description: 'Herb-seasoned grilled chicken breast',
      price: 18.99,
      categoryId: categories[0].id,
      allergenTags: '[]',
      isModifiable: true,
      modificationNote: 'Can be prepared with different seasonings',
      displayOrder: 4,
    },
    {
      name: 'Vegetable Soup',
      description: 'Fresh seasonal vegetables in clear broth',
      price: 9.99,
      categoryId: categories[1].id,
      allergenTags: '[]',
      isModifiable: true,
      modificationNote: 'Vegan-friendly option available',
      displayOrder: 5,
    },
  ];

  const createdDishes = [];
  for (const dishData of dishes) {
    const dish = await prisma.dish.create({
      data: {
        ...dishData,
        restaurantId: restaurant.id,
      },
    });
    createdDishes.push(dish);
  }

  console.log(`✅ Created ${createdDishes.length} dishes`);

  // Create dish-ingredient relationships
  console.log('🔗 Creating dish-ingredient relationships...');
  
  // Margherita Pizza ingredients
  await prisma.dishIngredient.createMany({
    data: [
      { dishId: createdDishes[0].id, ingredientId: ingredients[0].id, isCore: true },
      { dishId: createdDishes[0].id, ingredientId: ingredients[1].id, isCore: true },
      { dishId: createdDishes[0].id, ingredientId: ingredients[2].id, isCore: true },
      { dishId: createdDishes[0].id, ingredientId: ingredients[3].id, isOptional: true },
    ],
  });

  console.log('✅ Created dish-ingredient relationships');

  console.log('\n🎉 MongoDB seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`Restaurant: ${restaurant.name} (${restaurant.slug})`);
  console.log(`Admin: ${adminUser.email} / admin123`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Ingredients: ${ingredients.length}`);
  console.log(`Dishes: ${createdDishes.length}`);
  console.log('\n🌐 Access URLs:');
  console.log(`Guest Menu: /r/${restaurant.slug}`);
  console.log(`Admin Panel: /r/${restaurant.slug}/admin`);
  console.log('\n🚀 Ready for production!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
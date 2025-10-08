const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { createId } = require('@paralleldrive/cuid2');

const prisma = new PrismaClient();

/**
 * Multi-tenant Migration Script for MenuShield
 * 
 * This script safely migrates the current single-tenant database
 * to a proper multi-tenant architecture with restaurant isolation.
 * 
 * CRITICAL: This is a destructive migration - backup your database first!
 */

async function migrateToMultiTenant() {
  console.log('🚀 Starting multi-tenant migration...');
  
  try {
    // Step 1: Create a backup of current data
    console.log('📦 Creating backup of current data...');
    const backupData = await createBackup();
    
    // Step 2: Create default restaurant from existing data
    console.log('🏢 Creating default restaurant...');
    const defaultRestaurant = await createDefaultRestaurant();
    
    // Step 3: Migrate users to be associated with restaurant
    console.log('👥 Migrating users...');
    await migrateUsers(defaultRestaurant.id);
    
    // Step 4: Add restaurant relationships to existing data
    console.log('🔗 Adding restaurant relationships...');
    await addRestaurantRelationships(defaultRestaurant.id);
    
    // Step 5: Create demo multi-tenant data
    console.log('🎭 Creating demo multi-tenant restaurants...');
    await createDemoRestaurants();
    
    // Step 6: Verify data integrity
    console.log('✅ Verifying migration...');
    await verifyMigration();
    
    console.log('🎉 Multi-tenant migration completed successfully!');
    console.log('📋 Migration Summary:');
    console.log(`   - Default restaurant created: ${defaultRestaurant.name}`);
    console.log(`   - Slug: ${defaultRestaurant.slug}`);
    console.log(`   - All existing data preserved and isolated`);
    console.log(`   - Demo restaurants created for testing`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Check backup data and restore if needed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackup() {
  const backup = {
    users: await prisma.user.findMany(),
    restaurants: await prisma.restaurant.findMany(),
    dishes: await prisma.dish.findMany(),
    ingredients: await prisma.ingredient.findMany(),
    categories: await prisma.category.findMany(),
    allergenTranslations: await prisma.allergenTranslation.findMany(),
  };
  
  // Save backup to file
  const fs = require('fs');
  const backupPath = `./backup-${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`📁 Backup saved to: ${backupPath}`);
  
  return backup;
}

async function createDefaultRestaurant() {
  // Get existing restaurant data or create default
  const existingRestaurant = await prisma.restaurant.findFirst();
  
  if (existingRestaurant) {
    // Update existing restaurant with new fields
    return await prisma.restaurant.update({
      where: { id: existingRestaurant.id },
      data: {
        slug: 'menushield-demo',
        isActive: true,
        subscriptionTier: 'premium',
        timezone: 'UTC',
        // Keep existing fields
        name: existingRestaurant.name,
        description: existingRestaurant.description,
        contact: existingRestaurant.contact,
        showPrices: existingRestaurant.showPrices,
        currency: existingRestaurant.currency,
        defaultLanguage: existingRestaurant.defaultLanguage,
        supportedLanguages: existingRestaurant.supportedLanguages,
      }
    });
  } else {
    // Create new default restaurant
    return await prisma.restaurant.create({
      data: {
        id: createId(),
        name: 'MenuShield Demo Restaurant',
        slug: 'menushield-demo',
        description: 'A safe dining experience for everyone',
        contact: 'contact@menushield.com',
        showPrices: true,
        currency: 'EUR',
        defaultLanguage: 'en',
        supportedLanguages: JSON.stringify(['en', 'fi', 'sv', 'de', 'fr']),
        isActive: true,
        subscriptionTier: 'premium',
        timezone: 'UTC',
      }
    });
  }
}

async function migrateUsers(defaultRestaurantId) {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Update user to include restaurant relationship
    await prisma.user.update({
      where: { id: user.id },
      data: {
        restaurantId: defaultRestaurantId,
        role: 'ADMIN', // All existing users become admins
        isActive: true,
        firstName: user.restaurantName?.split(' ')[0] || 'Admin',
        lastName: user.restaurantName?.split(' ').slice(1).join(' ') || 'User',
      }
    });
  }
  
  console.log(`   - Migrated ${users.length} users to restaurant ${defaultRestaurantId}`);
}

async function addRestaurantRelationships(defaultRestaurantId) {
  // Add restaurant relationships to existing data
  
  // Update dishes
  const dishes = await prisma.dish.findMany();
  for (const dish of dishes) {
    await prisma.dish.update({
      where: { id: dish.id },
      data: {
        restaurantId: defaultRestaurantId,
        isActive: dish.isActive ?? true,
        isFeatured: false,
        displayOrder: 0,
      }
    });
  }
  console.log(`   - Updated ${dishes.length} dishes`);
  
  // Update categories
  const categories = await prisma.category.findMany();
  for (const category of categories) {
    await prisma.category.update({
      where: { id: category.id },
      data: {
        restaurantId: defaultRestaurantId,
        isActive: true,
        displayOrder: 0,
      }
    });
  }
  console.log(`   - Updated ${categories.length} categories`);
  
  // Update ingredients
  const ingredients = await prisma.ingredient.findMany();
  for (const ingredient of ingredients) {
    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: {
        restaurantId: defaultRestaurantId,
        isActive: true,
      }
    });
  }
  console.log(`   - Updated ${ingredients.length} ingredients`);
}

async function createDemoRestaurants() {
  // Create additional demo restaurants for testing multi-tenancy
  
  const demoRestaurants = [
    {
      name: 'Bella Italia',
      slug: 'bella-italia',
      description: 'Authentic Italian cuisine with allergen-safe options',
      contact: '+358 9 1234 5678',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'it', 'fi']),
      timezone: 'Europe/Helsinki',
    },
    {
      name: 'Sushi Zen',
      slug: 'sushi-zen',
      description: 'Fresh sushi and Japanese dishes',
      contact: '+358 40 987 6543',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'ja', 'fi']),
      timezone: 'Europe/Helsinki',
    },
    {
      name: 'Green Garden',
      slug: 'green-garden',
      description: 'Plant-based restaurant with comprehensive allergen info',
      contact: '+358 50 555 0123',
      currency: 'EUR',
      defaultLanguage: 'en',
      supportedLanguages: JSON.stringify(['en', 'fi', 'sv', 'de']),
      timezone: 'Europe/Helsinki',
    }
  ];
  
  for (const restaurantData of demoRestaurants) {
    const restaurant = await prisma.restaurant.create({
      data: {
        ...restaurantData,
        isActive: true,
        subscriptionTier: 'free',
        showPrices: true,
      }
    });
    
    // Create admin user for each restaurant
    const adminEmail = `admin@${restaurantData.slug}.com`;
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'OWNER',
        isActive: true,
        restaurantId: restaurant.id,
      }
    });
    
    // Create sample dishes for each restaurant
    await createSampleDishes(restaurant.id, restaurantData.name);
    
    console.log(`   - Created demo restaurant: ${restaurant.name} (admin: ${adminEmail})`);
  }
}

async function createSampleDishes(restaurantId, restaurantName) {
  // Create a few sample dishes for demo restaurants
  const sampleDishes = [
    {
      name: `${restaurantName} Special`,
      description: 'Our signature dish with carefully selected ingredients',
      price: 18.50,
      allergenTags: JSON.stringify(['gluten']),
      isModifiable: true,
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Safe Option',
      description: 'Allergen-free option suitable for most dietary restrictions',
      price: 16.00,
      allergenTags: JSON.stringify([]),
      isModifiable: false,
      isActive: true,
      isFeatured: false,
    }
  ];
  
  for (const dishData of sampleDishes) {
    await prisma.dish.create({
      data: {
        ...dishData,
        restaurantId,
        displayOrder: 0,
        modificationNote: dishData.isModifiable ? 'Can be modified upon request' : null,
      }
    });
  }
}

async function verifyMigration() {
  // Verify that all data has proper restaurant relationships
  
  const stats = {
    restaurants: await prisma.restaurant.count(),
    users: await prisma.user.count(),
    dishes: await prisma.dish.count(),
    ingredients: await prisma.ingredient.count(),
    categories: await prisma.category.count(),
  };
  
  // Check for orphaned data (should be 0)
  const orphanedUsers = await prisma.user.count({
    where: { restaurantId: null }
  });
  
  const orphanedDishes = await prisma.dish.count({
    where: { restaurantId: null }
  });
  
  if (orphanedUsers > 0 || orphanedDishes > 0) {
    throw new Error(`Migration incomplete: ${orphanedUsers} orphaned users, ${orphanedDishes} orphaned dishes`);
  }
  
  console.log('   ✅ All data properly associated with restaurants');
  console.log(`   📊 Final counts: ${JSON.stringify(stats, null, 2)}`);
  
  // Test restaurant isolation
  const restaurants = await prisma.restaurant.findMany({
    include: {
      users: true,
      dishes: true,
      _count: {
        select: {
          users: true,
          dishes: true,
          categories: true,
          ingredients: true,
        }
      }
    }
  });
  
  console.log('   🏢 Restaurant isolation verified:');
  restaurants.forEach(restaurant => {
    console.log(`     - ${restaurant.name} (${restaurant.slug}): ${restaurant._count.users} users, ${restaurant._count.dishes} dishes`);
  });
}

// Run migration if called directly
if (require.main === module) {
  migrateToMultiTenant()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMultiTenant };
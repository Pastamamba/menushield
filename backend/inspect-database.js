import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDatabase() {
  console.log('🔍 Inspecting database structure...');

  try {
    // Get all restaurants first
    const restaurants = await prisma.restaurant.findMany({
      select: { 
        id: true, 
        name: true, 
        slug: true,
        _count: {
          select: { dishes: true }
        }
      }
    });
    
    console.log(`\n📊 Found ${restaurants.length} restaurants:`);
    restaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (${restaurant.slug}): ${restaurant._count.dishes} dishes`);
    });

    // Try to count all dishes (including orphaned ones)
    const totalDishCount = await prisma.dish.count();
    console.log(`\n🍽️ Total dishes in database: ${totalDishCount}`);

    // Get some sample dishes to see structure
    const sampleDishes = await prisma.dish.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        restaurantId: true,
        translations: true,
        translatedLanguages: true
      }
    });

    console.log('\n🔬 Sample dishes:');
    sampleDishes.forEach(dish => {
      console.log(`  - "${dish.name}" (restaurant: ${dish.restaurantId || 'NULL'})`);
      if (dish.translations) {
        console.log(`    translations: ${dish.translations.substring(0, 100)}...`);
      }
      if (dish.translatedLanguages) {
        console.log(`    translatedLanguages: ${dish.translatedLanguages}`);
      }
    });

    // Try to find dishes without restaurantId
    try {
      const orphanedDishes = await prisma.$queryRaw`db.dishes.find({"restaurant_id": null}).limit(10)`;
      console.log(`\n🚫 Orphaned dishes found: ${orphanedDishes?.length || 0}`);
    } catch (error) {
      console.log('\n🚫 Cannot check orphaned dishes with raw query');
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase().catch(console.error);
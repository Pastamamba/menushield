// Update script to add isActive field to existing dishes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDatabase() {
  try {
    console.log('🔄 Starting database update...');
    
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Get all dishes without isActive field and add it
    console.log('📋 Fetching existing dishes...');
    const dishes = await prisma.dish.findMany({});
    console.log(`Found ${dishes.length} dishes`);
    
    // Update dishes that don't have isActive field (will be undefined)
    for (const dish of dishes) {
      if (dish.isActive === undefined || dish.isActive === null) {
        await prisma.dish.update({
          where: { id: dish.id },
          data: { isActive: true }
        });
        console.log(`✅ Updated dish: ${dish.name}`);
      }
    }
    
    console.log('🎉 Database update completed successfully!');
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase();
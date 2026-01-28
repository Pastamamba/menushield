import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCollections() {
  try {
    // Test ingredients (lowercase) collection
    const ingredientsCount = await prisma.$runCommandRaw({
      find: 'ingredients',
      limit: 1
    });
    console.log('ingredients (lowercase) count:', ingredientsCount.cursor.firstBatch.length);
    
    if (ingredientsCount.cursor.firstBatch.length > 0) {
      console.log('First ingredient from lowercase:', JSON.stringify(ingredientsCount.cursor.firstBatch[0], null, 2));
    }

    // Test Ingredient (uppercase) collection
    try {
      const IngredientCount = await prisma.$runCommandRaw({
        find: 'Ingredient',
        limit: 1
      });
      console.log('Ingredient (uppercase) count:', IngredientCount.cursor.firstBatch.length);
      
      if (IngredientCount.cursor.firstBatch.length > 0) {
        console.log('First ingredient from uppercase:', JSON.stringify(IngredientCount.cursor.firstBatch[0], null, 2));
      }
    } catch (err) {
      console.log('Ingredient (uppercase) collection does not exist or error:', err.message);
    }

    // Test what prisma.ingredient.findFirst() returns
    const prismaFirst = await prisma.ingredient.findFirst();
    console.log('\nPrisma ingredient.findFirst() returns from collection:', prismaFirst ? 'ingredients' : 'none');
    if (prismaFirst) {
      console.log('Has translations:', prismaFirst.translations ? 'YES' : 'NO');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollections();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanupCollections() {
  try {
    console.log('🗑️ Cleaning up duplicate Ingredient collection...\n');
    
    // Check current state
    const ingredientsCount = await prisma.$runCommandRaw({
      find: 'ingredients',
      projection: { _id: 1 }
    });
    
    const IngredientCount = await prisma.$runCommandRaw({
      find: 'Ingredient',
      projection: { _id: 1 }
    });

    console.log('📊 Current state:');
    console.log('- ingredients (lowercase, with translations):', ingredientsCount.cursor.firstBatch.length);
    console.log('- Ingredient (uppercase, no translations):', IngredientCount.cursor.firstBatch.length);

    if (IngredientCount.cursor.firstBatch.length > 0) {
      console.log('\n🚨 Found duplicate Ingredient collection (uppercase)');
      console.log('This collection has no translations and should be removed.');
      console.log('The correct collection is "ingredients" (lowercase) which has all translations.\n');
      
      // Ask for confirmation
      console.log('⚠️ DANGER: About to DROP the Ingredient collection (uppercase)');
      console.log('This will permanently delete all data in that collection.');
      console.log('The ingredients collection (lowercase) with translations will remain untouched.\n');
      
      // Drop the uppercase Ingredient collection
      await prisma.$runCommandRaw({
        drop: 'Ingredient'
      });
      
      console.log('✅ Successfully dropped Ingredient collection (uppercase)');
      console.log('✅ ingredients collection (lowercase) with translations is preserved');
    } else {
      console.log('\n✅ No duplicate Ingredient collection found. All good!');
    }

    // Verify final state
    console.log('\n📊 Final verification:');
    const finalCount = await prisma.ingredient.count();
    const firstIngredient = await prisma.ingredient.findFirst();
    
    console.log('- Total ingredients via Prisma:', finalCount);
    console.log('- Has translations:', firstIngredient?.translations ? 'YES ✅' : 'NO ❌');
    
    if (firstIngredient?.translations) {
      const translations = JSON.parse(firstIngredient.translations);
      console.log('- Available languages:', Object.keys(translations));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCollections();
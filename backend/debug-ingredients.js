import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugIngredients() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      take: 5
    });

    console.log('🔍 Debugging first 5 ingredients:');
    
    ingredients.forEach((ingredient, index) => {
      console.log(`\n--- Ingredient ${index + 1} ---`);
      console.log('Name:', ingredient.name);
      console.log('Has translations field:', !!ingredient.translations);
      
      if (ingredient.translations) {
        console.log('Translations field type:', typeof ingredient.translations);
        console.log('Translations raw:', ingredient.translations);
        
        try {
          const parsed = JSON.parse(ingredient.translations);
          console.log('Parsed translations:', parsed);
          console.log('Available languages:', Object.keys(parsed));
          
          if (parsed.fi && parsed.fi.name) {
            console.log('Finnish name:', parsed.fi.name);
          } else {
            console.log('❌ No Finnish translation found');
          }
          
        } catch (e) {
          console.log('❌ Failed to parse translations:', e.message);
        }
      } else {
        console.log('❌ No translations field');
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugIngredients();
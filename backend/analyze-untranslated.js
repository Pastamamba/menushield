import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class UnTranslatedAnalyzer {
  async analyzeUntranslated() {
    console.log('🔍 Analyzing untranslated items...');
    
    try {
      await this.analyzeDishes();
      await this.analyzeIngredients();
      await this.analyzeCategories();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async analyzeDishes() {
    console.log('\n🍽️ UNTRANSLATED DISHES');
    console.log('═'.repeat(30));
    
    const dishesRaw = await prisma.$runCommandRaw({
      find: 'dishes',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        restaurant_id: 1,
        translated_languages: 1
      }
    });

    const dishes = dishesRaw.cursor.firstBatch.filter(dish => dish.restaurant_id);
    
    const untranslated = dishes.filter(dish => {
      if (!dish.translated_languages) return true;
      
      try {
        const langs = typeof dish.translated_languages === 'string'
          ? JSON.parse(dish.translated_languages)
          : dish.translated_languages;
          
        return !Array.isArray(langs) || langs.length === 0;
      } catch (e) {
        return true;
      }
    });

    console.log(`📋 Untranslated dishes (${untranslated.length}/${dishes.length}):`);
    untranslated.forEach((dish, index) => {
      console.log(`${index + 1}. "${dish.name}"`);
    });
  }

  async analyzeIngredients() {
    console.log('\n🥬 UNTRANSLATED INGREDIENTS');
    console.log('═'.repeat(30));
    
    const ingredientsRaw = await prisma.$runCommandRaw({
      find: 'ingredients',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        translated_languages: 1
      }
    });

    const ingredients = ingredientsRaw.cursor.firstBatch;
    
    const untranslated = ingredients.filter(ingredient => {
      if (!ingredient.translated_languages) return true;
      
      try {
        const langs = typeof ingredient.translated_languages === 'string'
          ? JSON.parse(ingredient.translated_languages)
          : ingredient.translated_languages;
          
        return !Array.isArray(langs) || langs.length === 0;
      } catch (e) {
        return true;
      }
    });

    console.log(`📋 Untranslated ingredients (${untranslated.length}/${ingredients.length}):`);
    untranslated.forEach((ingredient, index) => {
      console.log(`${index + 1}. "${ingredient.name}"`);
    });
  }

  async analyzeCategories() {
    console.log('\n📂 UNTRANSLATED CATEGORIES');
    console.log('═'.repeat(30));
    
    const categoriesRaw = await prisma.$runCommandRaw({
      find: 'categories',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        translated_languages: 1
      }
    });

    const categories = categoriesRaw.cursor.firstBatch;
    
    const untranslated = categories.filter(category => {
      if (!category.translated_languages) return true;
      
      try {
        const langs = typeof category.translated_languages === 'string'
          ? JSON.parse(category.translated_languages)
          : category.translated_languages;
          
        return !Array.isArray(langs) || langs.length === 0;
      } catch (e) {
        return true;
      }
    });

    console.log(`📋 Untranslated categories (${untranslated.length}/${categories.length}):`);
    untranslated.forEach((category, index) => {
      console.log(`${index + 1}. "${category.name}"`);
    });
  }
}

async function main() {
  const analyzer = new UnTranslatedAnalyzer();
  await analyzer.analyzeUntranslated();
}

main().catch(console.error);
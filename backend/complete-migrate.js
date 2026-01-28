import { PrismaClient } from '@prisma/client';
import { TemplateTranslationService } from './services/TemplateTranslationService.js';

const prisma = new PrismaClient();

class CompleteMigrator {
  constructor() {
    this.templateService = new TemplateTranslationService();
    this.stats = {
      dishes: { total: 0, translated: 0, updated: 0 },
      ingredients: { total: 0, translated: 0, updated: 0 },
      categories: { total: 0, translated: 0, updated: 0 }
    };
  }

  async migrateAll() {
    console.log('🚀 Starting complete translation migration...');
    console.log('Will translate: Dishes, Ingredients, and Categories');
    
    try {
      // Migrate dishes
      await this.migrateDishes();
      
      // Migrate ingredients  
      await this.migrateIngredients();
      
      // Migrate categories
      await this.migrateCategories();
      
      // Print final stats
      this.printFinalStats();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async migrateDishes() {
    console.log('\n🍽️ MIGRATING DISHES');
    console.log('═'.repeat(30));
    
    const dishesRaw = await prisma.$runCommandRaw({
      find: 'dishes',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        restaurant_id: 1,
        translations: 1,
        translated_languages: 1
      }
    });

    const dishes = dishesRaw.cursor.firstBatch.filter(dish => dish.restaurant_id);
    this.stats.dishes.total = dishes.length;
    
    console.log(`📋 Found ${dishes.length} valid dishes`);

    for (const dish of dishes) {
      if (await this.translateEntity(dish, 'dishes', 'dish')) {
        this.stats.dishes.updated++;
      }
      this.stats.dishes.translated++;
    }
  }

  async migrateIngredients() {
    console.log('\n🥬 MIGRATING INGREDIENTS');
    console.log('═'.repeat(30));
    
    const ingredientsRaw = await prisma.$runCommandRaw({
      find: 'ingredients',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        translations: 1,
        translated_languages: 1
      }
    });

    const ingredients = ingredientsRaw.cursor.firstBatch;
    this.stats.ingredients.total = ingredients.length;
    
    console.log(`📋 Found ${ingredients.length} ingredients`);

    for (const ingredient of ingredients) {
      if (await this.translateEntity(ingredient, 'ingredients', 'ingredient')) {
        this.stats.ingredients.updated++;
      }
      this.stats.ingredients.translated++;
    }
  }

  async migrateCategories() {
    console.log('\n📂 MIGRATING CATEGORIES');
    console.log('═'.repeat(30));
    
    const categoriesRaw = await prisma.$runCommandRaw({
      find: 'categories',
      filter: {},
      projection: {
        _id: 1,
        name: 1,
        translations: 1,
        translated_languages: 1
      }
    });

    const categories = categoriesRaw.cursor.firstBatch;
    this.stats.categories.total = categories.length;
    
    console.log(`📋 Found ${categories.length} categories`);

    for (const category of categories) {
      if (await this.translateEntity(category, 'categories', 'category')) {
        this.stats.categories.updated++;
      }
      this.stats.categories.translated++;
    }
  }

  async translateEntity(entity, collection, type) {
    try {
      console.log(`🔄 Processing ${type}: "${entity.name}"`);
      
      // Check if already has translations
      let existingTranslatedLangs = [];
      if (entity.translated_languages) {
        if (typeof entity.translated_languages === 'string') {
          try {
            existingTranslatedLangs = JSON.parse(entity.translated_languages);
          } catch (e) {
            existingTranslatedLangs = [];
          }
        } else if (Array.isArray(entity.translated_languages)) {
          existingTranslatedLangs = entity.translated_languages;
        }
      }

      let needsUpdate = false;
      let translations = {};
      let translatedLanguages = [...existingTranslatedLangs];

      // Parse existing translations if any
      if (entity.translations) {
        if (typeof entity.translations === 'string') {
          try {
            translations = JSON.parse(entity.translations);
          } catch (e) {
            translations = {};
          }
        } else if (typeof entity.translations === 'object') {
          translations = entity.translations;
        }
      }

      // Translate to Finnish if not exists
      if (!translatedLanguages.includes('fi')) {
        let fiResult;
        
        switch (type) {
          case 'ingredient':
            fiResult = await this.templateService.translateIngredientName(entity.name, 'fi');
            break;
          case 'category':
            fiResult = await this.templateService.translateCategoryName(entity.name, 'fi');
            break;
          default:
            fiResult = await this.templateService.translateDishName(entity.name, 'fi');
        }
        
        if (fiResult.success && fiResult.translation !== entity.name) {
          if (!translations.fi) translations.fi = {};
          translations.fi.name = fiResult.translation;
          translations.fi.confidence = fiResult.confidence;
          translations.fi.method = fiResult.method;
          translatedLanguages.push('fi');
          needsUpdate = true;
          console.log(`  🇫🇮 Finnish: "${fiResult.translation}" (${fiResult.confidence}%)`);
        }
      }

      // Translate to Swedish if not exists
      if (!translatedLanguages.includes('sv')) {
        let svResult;
        
        switch (type) {
          case 'ingredient':
            svResult = await this.templateService.translateIngredientName(entity.name, 'sv');
            break;
          case 'category':
            svResult = await this.templateService.translateCategoryName(entity.name, 'sv');
            break;
          default:
            svResult = await this.templateService.translateDishName(entity.name, 'sv');
        }
        
        if (svResult.success && svResult.translation !== entity.name) {
          if (!translations.sv) translations.sv = {};
          translations.sv.name = svResult.translation;
          translations.sv.confidence = svResult.confidence;
          translations.sv.method = svResult.method;
          translatedLanguages.push('sv');
          needsUpdate = true;
          console.log(`  🇸🇪 Swedish: "${svResult.translation}" (${svResult.confidence}%)`);
        }
      }

      // Update if needed using raw MongoDB update
      if (needsUpdate) {
        await prisma.$runCommandRaw({
          update: collection,
          updates: [{
            q: { _id: entity._id },
            u: {
              $set: {
                translations: JSON.stringify(translations),
                translated_languages: JSON.stringify(translatedLanguages)
              }
            }
          }]
        });
        console.log(`  ✅ Updated ${type} in database`);
        return true;
      } else {
        console.log(`  💭 No updates needed`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error processing ${type} "${entity.name}":`, error.message);
      return false;
    }
  }

  printFinalStats() {
    console.log('\n📊 MIGRATION COMPLETE!');
    console.log('═'.repeat(50));
    
    console.log('\n🍽️ DISHES:');
    console.log(`  📋 Total: ${this.stats.dishes.total}`);
    console.log(`  ✅ Processed: ${this.stats.dishes.translated}`);
    console.log(`  💾 Updated: ${this.stats.dishes.updated}`);
    
    console.log('\n🥬 INGREDIENTS:');
    console.log(`  📋 Total: ${this.stats.ingredients.total}`);
    console.log(`  ✅ Processed: ${this.stats.ingredients.translated}`);
    console.log(`  💾 Updated: ${this.stats.ingredients.updated}`);
    
    console.log('\n📂 CATEGORIES:');
    console.log(`  📋 Total: ${this.stats.categories.total}`);
    console.log(`  ✅ Processed: ${this.stats.categories.translated}`);
    console.log(`  💾 Updated: ${this.stats.categories.updated}`);
    
    const totalUpdated = this.stats.dishes.updated + this.stats.ingredients.updated + this.stats.categories.updated;
    console.log(`\n🎉 Total items updated: ${totalUpdated}`);
  }

  async checkStatus() {
    console.log('🔍 Checking complete translation status...');
    
    try {
      // Check dishes
      const dishesResult = await prisma.$runCommandRaw({
        find: 'dishes',
        filter: {},
        projection: { name: 1, translated_languages: 1, restaurant_id: 1 }
      });
      const dishes = dishesResult.cursor.firstBatch.filter(dish => dish.restaurant_id);
      
      // Check ingredients
      const ingredientsResult = await prisma.$runCommandRaw({
        find: 'ingredients',
        filter: {},
        projection: { name: 1, translated_languages: 1 }
      });
      const ingredients = ingredientsResult.cursor.firstBatch;
      
      // Check categories
      const categoriesResult = await prisma.$runCommandRaw({
        find: 'categories',
        filter: {},
        projection: { name: 1, translated_languages: 1 }
      });
      const categories = categoriesResult.cursor.firstBatch;

      // Calculate stats for each type
      const dishStats = this.calculateEntityStats(dishes);
      const ingredientStats = this.calculateEntityStats(ingredients);
      const categoryStats = this.calculateEntityStats(categories);

      console.log('\n📊 COMPLETE TRANSLATION STATUS');
      console.log('═'.repeat(50));
      
      console.log('\n🍽️ DISHES:');
      this.printEntityStats(dishStats);
      
      console.log('\n🥬 INGREDIENTS:');
      this.printEntityStats(ingredientStats);
      
      console.log('\n📂 CATEGORIES:');
      this.printEntityStats(categoryStats);

    } catch (error) {
      console.error('❌ Status check failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  calculateEntityStats(entities) {
    const stats = {
      total: entities.length,
      withFinnish: 0,
      withSwedish: 0,
      withBoth: 0,
      withNone: 0
    };

    entities.forEach(entity => {
      let langs = [];
      
      if (entity.translated_languages) {
        try {
          if (typeof entity.translated_languages === 'string') {
            langs = JSON.parse(entity.translated_languages);
          } else if (Array.isArray(entity.translated_languages)) {
            langs = entity.translated_languages;
          }
        } catch (e) {
          langs = [];
        }
      }

      const hasFi = langs.includes('fi');
      const hasSv = langs.includes('sv');

      if (hasFi) stats.withFinnish++;
      if (hasSv) stats.withSwedish++;
      if (hasFi && hasSv) stats.withBoth++;
      if (!hasFi && !hasSv) stats.withNone++;
    });

    return stats;
  }

  printEntityStats(stats) {
    if (stats.total === 0) {
      console.log('  📋 No items found');
      return;
    }
    
    console.log(`  📋 Total: ${stats.total}`);
    console.log(`  🇫🇮 With Finnish: ${stats.withFinnish} (${(stats.withFinnish/stats.total*100).toFixed(1)}%)`);
    console.log(`  🇸🇪 With Swedish: ${stats.withSwedish} (${(stats.withSwedish/stats.total*100).toFixed(1)}%)`);
    console.log(`  ✅ With both: ${stats.withBoth} (${(stats.withBoth/stats.total*100).toFixed(1)}%)`);
    console.log(`  ❌ Without translations: ${stats.withNone} (${(stats.withNone/stats.total*100).toFixed(1)}%)`);
  }
}

async function main() {
  const migrator = new CompleteMigrator();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    await migrator.checkStatus();
    return;
  }

  if (args.includes('--help')) {
    console.log('Complete Database Translation Migrator');
    console.log('Translates Dishes, Ingredients, and Categories');
    console.log('');
    console.log('Usage:');
    console.log('  node complete-migrate.js          # Run full migration');
    console.log('  node complete-migrate.js --status # Check current status');
    console.log('  node complete-migrate.js --help   # Show this help');
    return;
  }

  // Show current status first
  await migrator.checkStatus();
  
  console.log('\n🚀 Starting complete migration in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await migrator.migrateAll();
}

main().catch(console.error);
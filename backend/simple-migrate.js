import { PrismaClient } from '@prisma/client';
import { TemplateTranslationService } from './services/TemplateTranslationService.js';

const prisma = new PrismaClient();

class SimpleMigrator {
  constructor() {
    this.templateService = new TemplateTranslationService();
  }

  async migrateAll() {
    console.log('🚀 Starting simple translation migration...');
    
    try {
      // Use raw MongoDB queries to handle mixed data types
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

      const dishes = dishesRaw.cursor.firstBatch;
      console.log(`📋 Found ${dishes.length} dishes in raw format`);

      let processedCount = 0;
      let updateCount = 0;

      for (const dish of dishes) {
        try {
          if (!dish.restaurant_id) {
            console.log(`⏭️ Skipping orphaned dish: "${dish.name}"`);
            continue;
          }

          console.log(`🍽️ Processing: "${dish.name}"`);
          
          // Check if already has translations
          let existingTranslatedLangs = [];
          if (dish.translated_languages) {
            if (typeof dish.translated_languages === 'string') {
              try {
                existingTranslatedLangs = JSON.parse(dish.translated_languages);
              } catch (e) {
                existingTranslatedLangs = [];
              }
            } else if (Array.isArray(dish.translated_languages)) {
              existingTranslatedLangs = dish.translated_languages;
            }
          }

          let needsUpdate = false;
          let translations = {};
          let translatedLanguages = [...existingTranslatedLangs];

          // Parse existing translations if any
          if (dish.translations) {
            if (typeof dish.translations === 'string') {
              try {
                translations = JSON.parse(dish.translations);
              } catch (e) {
                translations = {};
              }
            } else if (typeof dish.translations === 'object') {
              translations = dish.translations;
            }
          }

          // Translate to Finnish if not exists
          if (!translatedLanguages.includes('fi')) {
            const fiResult = await this.templateService.translateDishName(dish.name, 'fi');
            if (fiResult.success && fiResult.translation !== dish.name) {
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
            const svResult = await this.templateService.translateDishName(dish.name, 'sv');
            if (svResult.success && svResult.translation !== dish.name) {
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
              update: 'dishes',
              updates: [{
                q: { _id: dish._id },
                u: {
                  $set: {
                    translations: JSON.stringify(translations),
                    translated_languages: JSON.stringify(translatedLanguages)
                  }
                }
              }]
            });
            updateCount++;
            console.log(`  ✅ Updated dish in database`);
          } else {
            console.log(`  💭 No updates needed`);
          }

          processedCount++;
        } catch (error) {
          console.error(`❌ Error processing dish "${dish.name}":`, error.message);
        }
      }

      console.log('\n🎉 Migration complete!');
      console.log(`📋 Processed: ${processedCount} dishes`);
      console.log(`💾 Updated: ${updateCount} dishes`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async checkStatus() {
    console.log('🔍 Checking translation status...');
    
    try {
      const result = await prisma.$runCommandRaw({
        find: 'dishes',
        filter: {},
        projection: {
          name: 1,
          translated_languages: 1,
          restaurant_id: 1
        }
      });

      const dishes = result.cursor.firstBatch;
      console.log(`📋 Found ${dishes.length} dishes`);

      let withFinnish = 0;
      let withSwedish = 0;
      let withBoth = 0;
      let withNone = 0;
      let orphaned = 0;

      dishes.forEach(dish => {
        if (!dish.restaurant_id) {
          orphaned++;
          return;
        }

        let langs = [];
        if (dish.translated_languages) {
          try {
            if (typeof dish.translated_languages === 'string') {
              langs = JSON.parse(dish.translated_languages);
            } else if (Array.isArray(dish.translated_languages)) {
              langs = dish.translated_languages;
            }
          } catch (e) {
            langs = [];
          }
        }

        const hasFi = langs.includes('fi');
        const hasSv = langs.includes('sv');

        if (hasFi) withFinnish++;
        if (hasSv) withSwedish++;
        if (hasFi && hasSv) withBoth++;
        if (!hasFi && !hasSv) withNone++;
      });

      const validDishes = dishes.length - orphaned;

      console.log('\n📊 TRANSLATION STATUS');
      console.log('═'.repeat(40));
      console.log(`📋 Total dishes: ${dishes.length}`);
      console.log(`🏠 Valid dishes: ${validDishes}`);
      console.log(`🚫 Orphaned dishes: ${orphaned}`);
      console.log(`🇫🇮 With Finnish: ${withFinnish} (${(withFinnish/validDishes*100).toFixed(1)}%)`);
      console.log(`🇸🇪 With Swedish: ${withSwedish} (${(withSwedish/validDishes*100).toFixed(1)}%)`);
      console.log(`✅ With both: ${withBoth} (${(withBoth/validDishes*100).toFixed(1)}%)`);
      console.log(`❌ Without translations: ${withNone} (${(withNone/validDishes*100).toFixed(1)}%)`);

    } catch (error) {
      console.error('❌ Status check failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const migrator = new SimpleMigrator();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    await migrator.checkStatus();
    return;
  }

  if (args.includes('--help')) {
    console.log('Simple Database Migrator');
    console.log('');
    console.log('Usage:');
    console.log('  node simple-migrate.js          # Run migration');
    console.log('  node simple-migrate.js --status # Check status');
    console.log('  node simple-migrate.js --help   # Show help');
    return;
  }

  // Show current status first
  await migrator.checkStatus();
  
  console.log('\n🚀 Starting migration in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await migrator.migrateAll();
}

main().catch(console.error);
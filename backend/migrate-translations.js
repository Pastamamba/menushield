import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import our template translation service
import { TemplateTranslationService } from './services/TemplateTranslationService.js';

const prisma = new PrismaClient();

class DatabaseTranslationMigrator {
  constructor() {
    this.templateService = new TemplateTranslationService();
    this.stats = {
      totalDishes: 0,
      translated: 0,
      updated: 0,
      errors: 0,
      byLanguage: {
        fi: 0,
        sv: 0
      }
    };
  }

  async migrate() {
    console.log('🚀 Starting database translation migration...');
    console.log('📊 MongoDB Connection:', process.env.DATABASE_URL ? 'Connected' : 'Missing!');
    
    try {
      // Get all dishes from all restaurants
      const dishes = await prisma.dish.findMany({
        include: {
          restaurant: {
            select: { id: true, name: true }
          }
        }
      });

      console.log(`📋 Found ${dishes.length} dishes in database`);
      this.stats.totalDishes = dishes.length;

      // Process dishes in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < dishes.length; i += batchSize) {
        const batch = dishes.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(dishes.length/batchSize)} (${batch.length} dishes)`);
        
        await this.processBatch(batch);
      }

      // Print final statistics
      this.printStats();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async processBatch(dishes) {
    const updates = [];

    for (const dish of dishes) {
      try {
        console.log(`🍽️  Processing: "${dish.name}" (${dish.restaurant.name})`);
        
        // Initialize translations object if not exists
        let translations = {};
        let translatedLanguages = [];

        // Parse existing translations if any
        if (dish.translations) {
          try {
            translations = typeof dish.translations === 'string' 
              ? JSON.parse(dish.translations) 
              : dish.translations;
          } catch (e) {
            console.warn(`⚠️  Invalid translations JSON for dish ${dish.id}, resetting...`);
            translations = {};
          }
        }

        // Parse existing translatedLanguages if any
        if (dish.translatedLanguages) {
          try {
            translatedLanguages = typeof dish.translatedLanguages === 'string'
              ? JSON.parse(dish.translatedLanguages)
              : dish.translatedLanguages;
            
            if (!Array.isArray(translatedLanguages)) {
              translatedLanguages = [];
            }
          } catch (e) {
            console.warn(`⚠️  Invalid translatedLanguages for dish ${dish.id}, resetting...`);
            translatedLanguages = [];
          }
        }

        let hasUpdates = false;

        // Translate to Finnish if not already translated
        if (!translatedLanguages.includes('fi')) {
          const fiTranslation = await this.templateService.translateDishName(dish.name, 'fi');
          if (fiTranslation.success && fiTranslation.translation !== dish.name) {
            if (!translations.fi) translations.fi = {};
            translations.fi.name = fiTranslation.translation;
            translations.fi.confidence = fiTranslation.confidence;
            translations.fi.method = fiTranslation.method;
            translatedLanguages.push('fi');
            this.stats.byLanguage.fi++;
            hasUpdates = true;
            console.log(`  🇫🇮 Finnish: "${fiTranslation.translation}" (${fiTranslation.confidence}% via ${fiTranslation.method})`);
          }
        } else {
          console.log(`  🇫🇮 Finnish: Already translated`);
        }

        // Translate to Swedish if not already translated
        if (!translatedLanguages.includes('sv')) {
          const svTranslation = await this.templateService.translateDishName(dish.name, 'sv');
          if (svTranslation.success && svTranslation.translation !== dish.name) {
            if (!translations.sv) translations.sv = {};
            translations.sv.name = svTranslation.translation;
            translations.sv.confidence = svTranslation.confidence;
            translations.sv.method = svTranslation.method;
            translatedLanguages.push('sv');
            this.stats.byLanguage.sv++;
            hasUpdates = true;
            console.log(`  🇸🇪 Swedish: "${svTranslation.translation}" (${svTranslation.confidence}% via ${svTranslation.method})`);
          }
        } else {
          console.log(`  🇸🇪 Swedish: Already translated`);
        }

        // Queue update if there are changes
        if (hasUpdates) {
          updates.push({
            id: dish.id,
            translations: JSON.stringify(translations),
            translatedLanguages: JSON.stringify(translatedLanguages)
          });
          this.stats.translated++;
        }

      } catch (error) {
        console.error(`❌ Error processing dish ${dish.id} ("${dish.name}"):`, error.message);
        this.stats.errors++;
      }
    }

    // Execute batch updates
    if (updates.length > 0) {
      console.log(`💾 Updating ${updates.length} dishes in database...`);
      
      try {
        // Use transaction for batch updates
        await prisma.$transaction(
          updates.map(update => 
            prisma.dish.update({
              where: { id: update.id },
              data: {
                translations: update.translations,
                translatedLanguages: update.translatedLanguages
              }
            })
          )
        );
        
        this.stats.updated += updates.length;
        console.log(`✅ Successfully updated ${updates.length} dishes`);
      } catch (error) {
        console.error('❌ Batch update failed:', error);
        this.stats.errors += updates.length;
      }
    }
  }

  printStats() {
    console.log('\n📊 MIGRATION COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`📋 Total dishes processed: ${this.stats.totalDishes}`);
    console.log(`✅ Dishes translated: ${this.stats.translated}`);
    console.log(`💾 Database updates: ${this.stats.updated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('\nBy language:');
    console.log(`🇫🇮 Finnish translations: ${this.stats.byLanguage.fi}`);
    console.log(`🇸🇪 Swedish translations: ${this.stats.byLanguage.sv}`);
    
    if (this.stats.translated > 0) {
      console.log(`\n🎉 Successfully translated ${this.stats.translated} new dishes!`);
    } else {
      console.log('\n💭 All dishes were already translated.');
    }
  }

  // Method to check current translation status
  async checkStatus() {
    console.log('🔍 Checking current translation status...');
    
    const dishes = await prisma.dish.findMany({
      select: {
        id: true,
        name: true,
        translatedLanguages: true,
        restaurant: {
          select: { name: true }
        }
      }
    });

    const stats = {
      total: dishes.length,
      withFinnish: 0,
      withSwedish: 0,
      withBoth: 0,
      withNone: 0
    };

    dishes.forEach(dish => {
      let langs = [];
      
      if (dish.translatedLanguages) {
        try {
          langs = typeof dish.translatedLanguages === 'string'
            ? JSON.parse(dish.translatedLanguages)
            : dish.translatedLanguages;
            
          if (!Array.isArray(langs)) langs = [];
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

    console.log('\n📊 CURRENT TRANSLATION STATUS');
    console.log('═'.repeat(40));
    console.log(`📋 Total dishes: ${stats.total}`);
    console.log(`🇫🇮 With Finnish: ${stats.withFinnish} (${(stats.withFinnish/stats.total*100).toFixed(1)}%)`);
    console.log(`🇸🇪 With Swedish: ${stats.withSwedish} (${(stats.withSwedish/stats.total*100).toFixed(1)}%)`);
    console.log(`✅ With both languages: ${stats.withBoth} (${(stats.withBoth/stats.total*100).toFixed(1)}%)`);
    console.log(`❌ Without translations: ${stats.withNone} (${(stats.withNone/stats.total*100).toFixed(1)}%)`);

    return stats;
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseTranslationMigrator();
  
  // Check if user wants to see status first
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    await migrator.checkStatus();
    return;
  }

  if (args.includes('--help')) {
    console.log('Database Translation Migrator');
    console.log('');
    console.log('Usage:');
    console.log('  node migrate-translations.js          # Run full migration');
    console.log('  node migrate-translations.js --status # Check current status');
    console.log('  node migrate-translations.js --help   # Show this help');
    return;
  }

  // Show status first, then ask for confirmation
  const currentStats = await migrator.checkStatus();
  
  if (currentStats.withNone === 0) {
    console.log('\n✨ All dishes already have translations! No migration needed.');
    return;
  }

  console.log(`\n🚀 Ready to translate ${currentStats.withNone} dishes without translations.`);
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to start...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await migrator.migrate();
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);
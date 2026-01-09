import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:W6bsyBbJ4qglqDvC@clustermenushield.uhfmg.mongodb.net/menushield?retryWrites=true&w=majority&appName=ClusterMenuShield';

// Complete allergen mappings for all major ingredients
const ingredientAllergens = {
  // FISH - Kala
  'salmon': ['fish'],
  'cod': ['fish'], 
  'tuna': ['fish'],
  'mackerel': ['fish'],
  'herring': ['fish'],
  'trout': ['fish'],
  'haddock': ['fish'],
  'pike': ['fish'],
  'perch': ['fish'],
  'flounder': ['fish'],
  'halibut': ['fish'],
  'swordfish': ['fish'],
  'anchovy': ['fish'],
  'sardine': ['fish'],
  'gravlax': ['fish'],
  'fish': ['fish'],

  // DAIRY - Maito
  'milk': ['dairy'],
  'butter': ['dairy'],
  'cream': ['dairy'],
  'cheese': ['dairy'],
  'mozzarella': ['dairy'],
  'parmesan': ['dairy'],
  'cheddar': ['dairy'],
  'goat cheese': ['dairy'],
  'feta': ['dairy'],
  'ricotta': ['dairy'],
  'cottage cheese': ['dairy'],
  'yogurt': ['dairy'],
  'greek yogurt': ['dairy'],
  'sour cream': ['dairy'],
  'buttermilk': ['dairy'],
  'burrata': ['dairy'],
  'halloumi': ['dairy'],
  'ghee': ['dairy'],

  // GLUTEN - Gluteeni
  'wheat': ['gluten', 'wheat'],
  'flour': ['gluten', 'wheat'], 
  'bread': ['gluten', 'wheat'],
  'pasta': ['gluten', 'wheat'],
  'penne': ['gluten', 'wheat'],
  'spaghetti': ['gluten', 'wheat'],
  'noodles': ['gluten', 'wheat'],
  'barley': ['gluten'],
  'rye': ['gluten'],
  'oats': ['gluten'], // Cross-contamination risk
  'seitan': ['gluten', 'wheat'], // Pure gluten

  // EGGS - Munat
  'egg': ['eggs'],
  'mayonnaise': ['eggs'],

  // NUTS - Pähkinät 
  'almond': ['nuts', 'tree_nuts'],
  'walnut': ['nuts', 'tree_nuts'],
  'pecan': ['nuts', 'tree_nuts'], 
  'hazelnut': ['nuts', 'tree_nuts'],
  'cashew': ['nuts', 'tree_nuts'],
  'pistachio': ['nuts', 'tree_nuts'],
  'brazil nut': ['nuts', 'tree_nuts'],
  'pine nut': ['nuts', 'tree_nuts'],
  'macadamia': ['nuts', 'tree_nuts'],

  // PEANUTS - Maapähkinät (eri kuin pähkinät)
  'peanut': ['peanuts'],

  // SESAME - Seesam
  'sesame': ['sesame'],
  'tahini': ['sesame'],

  // SOY - Soija
  'soy': ['soy'],
  'tofu': ['soy'],
  'tempeh': ['soy'],
  'soy sauce': ['soy'],
  'miso': ['soy'],

  // SHELLFISH - Äyriäiset
  'shrimp': ['shellfish', 'crustaceans'],
  'crab': ['shellfish', 'crustaceans'],
  'lobster': ['shellfish', 'crustaceans'],
  'crawfish': ['shellfish', 'crustaceans'],
  'mussel': ['shellfish', 'mollusks'],
  'oyster': ['shellfish', 'mollusks'],
  'scallop': ['shellfish', 'mollusks'],
  'clam': ['shellfish', 'mollusks'],
  'squid': ['shellfish', 'mollusks'],

  // SULFITES - Sulfiitit
  'wine': ['sulfites'],
  'glögg': ['sulfites'], // Nordic mulled wine
};

function findAllergens(ingredientName) {
  const name = ingredientName.toLowerCase().trim();
  const allergens = new Set();

  // Check each allergen mapping
  for (const [keyword, tags] of Object.entries(ingredientAllergens)) {
    if (name.includes(keyword)) {
      tags.forEach(tag => allergens.add(tag));
    }
  }

  return Array.from(allergens).sort();
}

async function updateAllIngredientsWithAllergens() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('menushield');
    const collection = db.collection('Ingredient');
    
    // Get all ingredients
    const ingredients = await collection.find({}).toArray();
    console.log(`📦 Found ${ingredients.length} ingredients to process`);
    
    let updatedWithAllergens = 0;
    let updatedWithoutAllergens = 0;
    const updates = [];

    // Process all ingredients
    for (const ingredient of ingredients) {
      const allergens = findAllergens(ingredient.name);
      const allergenJson = JSON.stringify(allergens);
      
      // Prepare bulk update
      updates.push({
        updateOne: {
          filter: { _id: ingredient._id },
          update: { 
            $set: { 
              allergenTags: allergenJson 
            }
          }
        }
      });

      if (allergens.length > 0) {
        console.log(`✅ ${ingredient.name} → ${allergenJson}`);
        updatedWithAllergens++;
      } else {
        console.log(`⚪ ${ingredient.name} → []`);
        updatedWithoutAllergens++;
      }
    }

    // Execute bulk update
    console.log(`\n🚀 Executing bulk update for ${updates.length} ingredients...`);
    const result = await collection.bulkWrite(updates);
    
    console.log(`\n🎯 RESULTS:`);
    console.log(`   Modified: ${result.modifiedCount}`);
    console.log(`   With allergens: ${updatedWithAllergens}`);
    console.log(`   Without allergens: ${updatedWithoutAllergens}`);
    console.log(`   Total processed: ${ingredients.length}`);
    
    // Verify a few key ingredients
    console.log(`\n🔍 VERIFICATION:`);
    const salmon = await collection.findOne({ name: { $regex: /salmon/i } });
    const yogurt = await collection.findOne({ name: { $regex: /greek yogurt/i } });
    const oats = await collection.findOne({ name: { $regex: /^oats$/i } });
    
    console.log(`   Salmon allergenTags: ${salmon?.allergenTags || 'NOT FOUND'}`);
    console.log(`   Greek Yogurt allergenTags: ${yogurt?.allergenTags || 'NOT FOUND'}`);  
    console.log(`   Oats allergenTags: ${oats?.allergenTags || 'NOT FOUND'}`);
    
    console.log(`\n✅ COMPLETE! All ingredients updated with correct allergen data.`);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

updateAllIngredientsWithAllergens();
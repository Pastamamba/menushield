import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:W6bsyBbJ4qglqDvC@clustermenushield.uhfmg.mongodb.net/menushield?retryWrites=true&w=majority&appName=ClusterMenuShield';

// Allergen mappings based on ingredient names
const allergenMappings = {
  // Fish
  'salmon': ['fish'],
  'cod': ['fish'],
  'tuna': ['fish'],
  'mackerel': ['fish'],
  'herring': ['fish'],
  'trout': ['fish'],
  'haddock': ['fish'],
  'pike': ['fish'],
  'perch': ['fish'],
  'anchovy': ['fish'],
  'sardine': ['fish'],

  // Dairy
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
  'sour cream': ['dairy'],
  'buttermilk': ['dairy'],
  'burrata': ['dairy'],

  // Gluten/Wheat
  'wheat': ['gluten', 'wheat'],
  'flour': ['gluten', 'wheat'],
  'bread': ['gluten', 'wheat'],
  'pasta': ['gluten', 'wheat'],
  'barley': ['gluten'],
  'rye': ['gluten'],
  'oats': ['gluten'], // May contain gluten due to cross-contamination

  // Eggs
  'egg': ['eggs'],
  'mayonnaise': ['eggs'],

  // Nuts
  'almond': ['nuts', 'tree_nuts'],
  'walnut': ['nuts', 'tree_nuts'],
  'pecan': ['nuts', 'tree_nuts'],
  'hazelnut': ['nuts', 'tree_nuts'],
  'cashew': ['nuts', 'tree_nuts'],
  'pistachio': ['nuts', 'tree_nuts'],
  'brazil nut': ['nuts', 'tree_nuts'],
  'pine nut': ['nuts', 'tree_nuts'],
  'macadamia': ['nuts', 'tree_nuts'],

  // Peanuts (separate from tree nuts)
  'peanut': ['peanuts'],
  'peanut oil': ['peanuts'],

  // Sesame
  'sesame': ['sesame'],
  'tahini': ['sesame'],

  // Soy
  'soy': ['soy'],
  'tofu': ['soy'],
  'tempeh': ['soy'],
  'soy sauce': ['soy'],
  'miso': ['soy'],

  // Shellfish
  'shrimp': ['shellfish', 'crustaceans'],
  'crab': ['shellfish', 'crustaceans'],
  'lobster': ['shellfish', 'crustaceans'],
  'crawfish': ['shellfish', 'crustaceans'],
  'mussel': ['shellfish', 'mollusks'],
  'oyster': ['shellfish', 'mollusks'],
  'scallop': ['shellfish, mollusks'],
  'clam': ['shellfish', 'mollusks'],

  // Sulfites
  'wine': ['sulfites'],
  'dried fruit': ['sulfites']
};

// Function to determine allergens for an ingredient
function getAllergensForIngredient(name) {
  const lowerName = name.toLowerCase();
  const allergens = [];

  for (const [keyword, tags] of Object.entries(allergenMappings)) {
    if (lowerName.includes(keyword)) {
      allergens.push(...tags);
    }
  }

  // Remove duplicates and return
  return [...new Set(allergens)];
}

async function updateIngredientsWithAllergens() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('menushield');
    const collection = db.collection('Ingredient');
    
    // Get all ingredients
    const ingredients = await collection.find({}).toArray();
    console.log(`Found ${ingredients.length} ingredients to update`);
    
    let updatedCount = 0;
    
    for (const ingredient of ingredients) {
      const allergens = getAllergensForIngredient(ingredient.name);
      const allergenJson = JSON.stringify(allergens);
      
      // Update the ingredient with allergen tags
      await collection.updateOne(
        { _id: ingredient._id },
        { 
          $set: { 
            allergenTags: allergenJson 
          }
        }
      );
      
      if (allergens.length > 0) {
        console.log(`✅ Updated ${ingredient.name}: ${allergenJson}`);
        updatedCount++;
      } else {
        console.log(`⚪ ${ingredient.name}: no allergens`);
      }
    }
    
    console.log(`\n🎯 Updated ${updatedCount} ingredients with allergens out of ${ingredients.length} total`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateIngredientsWithAllergens();
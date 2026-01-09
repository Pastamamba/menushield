import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:W6bsyBbJ4qglqDvC@clustermenushield.uhfmg.mongodb.net/menushield?retryWrites=true&w=majority&appName=ClusterMenuShield';

async function fixAllergenTags() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('menushield');
    const collection = db.collection('Ingredient');
    
    // Find all ingredients with null allergen_tags
    const nullCount = await collection.countDocuments({ allergen_tags: null });
    console.log(`Found ${nullCount} ingredients with null allergen_tags`);
    
    // Find all ingredients with missing allergen_tags field
    const missingCount = await collection.countDocuments({ allergen_tags: { $exists: false } });
    console.log(`Found ${missingCount} ingredients with missing allergen_tags`);
    
    // Find all ingredients with empty string allergen_tags
    const emptyCount = await collection.countDocuments({ allergen_tags: "" });
    console.log(`Found ${emptyCount} ingredients with empty string allergen_tags`);
    
    // Update all null or missing allergen_tags to empty array JSON
    const result = await collection.updateMany(
      { $or: [
        { allergen_tags: null },
        { allergen_tags: { $exists: false } },
        { allergen_tags: "" }
      ]},
      { $set: { allergen_tags: "[]" } }
    );
    
    console.log(`Updated ${result.modifiedCount} ingredients`);
    
    // Verify all ingredients have valid allergen_tags
    const totalCount = await collection.countDocuments();
    const validCount = await collection.countDocuments({ 
      allergen_tags: { $type: "string", $ne: null } 
    });
    
    console.log(`Total ingredients: ${totalCount}`);
    console.log(`Ingredients with valid allergen_tags: ${validCount}`);
    
    // Sample a few ingredients to see their allergen_tags
    const samples = await collection.find({}).limit(5).toArray();
    console.log('\nSample ingredients:');
    samples.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name}: allergen_tags = "${ing.allergen_tags}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixAllergenTags();
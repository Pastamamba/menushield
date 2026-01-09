import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:W6bsyBbJ4qglqDvC@clustermenushield.uhfmg.mongodb.net/menushield?retryWrites=true&w=majority&appName=ClusterMenuShield';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('menushield');
    const collection = db.collection('Ingredient');
    
    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`Total ingredients in database: ${totalCount}`);
    
    // Find ingredients with actual allergenTags data
    const withAllergens = await collection.find({ allergenTags: { $ne: null } }).toArray();
    console.log(`Ingredients with non-null allergenTags: ${withAllergens.length}`);
    
    // Sample a few ingredients to see their structure
    const samples = await collection.find({}).limit(10).toArray();
    console.log('\nFirst 10 ingredients:');
    samples.forEach((ing, i) => {
      console.log(`${i + 1}. Name: ${ing.name}`);
      console.log(`   allergenTags: ${ing.allergenTags} (type: ${typeof ing.allergenTags})`);
      console.log(`   allergen_tags: ${ing.allergen_tags} (type: ${typeof ing.allergen_tags})`);
      console.log('---');
    });
    
    // Look specifically for salmon
    const salmon = await collection.findOne({ name: { $regex: /salmon/i } });
    console.log('\nSalmon data:');
    console.log(salmon);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
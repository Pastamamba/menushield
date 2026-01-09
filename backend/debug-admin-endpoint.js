import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy the current safeParseArray function
function safeParseArray(val) {
  console.log('🔍 safeParseArray input:', val, typeof val);
  
  // If already an array, return as-is
  if (Array.isArray(val)) {
    console.log('✅ Already array, returning:', val);
    return val;
  }
  
  // If null or undefined, return empty array
  if (!val) {
    console.log('⚪ Null/undefined, returning []');
    return [];
  }
  
  if (typeof val === "string") {
    console.log('🔍 Processing string:', val);
    // Handle double-encoded JSON strings like "["fish"]" 
    let cleanVal = val.trim();
    
    // If string starts and ends with quotes and contains JSON array, remove outer quotes
    if (cleanVal.startsWith('"') && cleanVal.endsWith('"') && cleanVal.includes('[')) {
      cleanVal = cleanVal.slice(1, -1); // Remove outer quotes
      console.log('🔍 Removed outer quotes:', cleanVal);
    }
    
    try {
      const parsed = JSON.parse(cleanVal);
      const result = Array.isArray(parsed) ? parsed : [parsed];
      console.log('✅ Parsed result:', result);
      return result;
    } catch (e) {
      console.log('❌ Parse failed, returning as single item:', [val]);
      return [val]; // If all parsing fails, return original as single item
    }
  }
  
  if (val && typeof val === "object" && "length" in val) {
    const result = Array.from(val);
    console.log('✅ Array-like object converted:', result);
    return result;
  }
  if (val && typeof val === "object") {
    const result = Object.values(val).filter((v) => typeof v === "string");
    console.log('✅ Object values filtered:', result);
    return result;
  }
  
  console.log('❌ Fallback to empty array');
  return [];
}

function getTranslatedContent(item, language, field) {
  // Simple fallback - just return the original field
  return item[field] || '';
}

function translateIngredient(ingredient, language) {
  console.log(`\n🌍 translateIngredient for: ${ingredient.name}`);
  console.log(`   Original allergenTags:`, ingredient.allergenTags, typeof ingredient.allergenTags);
  
  const parsed = safeParseArray(ingredient.allergenTags);
  console.log(`   Parsed allergen_tags:`, parsed);
  
  return {
    ...ingredient,
    name: getTranslatedContent(ingredient, language, "name"),
    description: getTranslatedContent(ingredient, language, "description"),
    allergen_tags: parsed, // Parse to array
  };
}

async function debugAdminEndpoint() {
  try {
    console.log('🔍 Testing admin ingredients endpoint logic...\n');
    
    const language = 'en';
    
    // Get ingredients like the admin endpoint does
    const ingredients = await prisma.ingredient.findMany({
      include: {
        category: true,
      },
      orderBy: [{ name: "asc" }],
    });
    
    console.log(`📦 Found ${ingredients.length} ingredients\n`);
    
    // Test a few specific ingredients
    const testNames = ['Tuna', 'Salmon', 'Greek Yogurt', 'Oats'];
    
    for (const testName of testNames) {
      const ingredient = ingredients.find(ing => ing.name === testName);
      if (ingredient) {
        console.log(`\n==== TESTING ${testName} ====`);
        console.log('Raw from database:', {
          name: ingredient.name,
          allergenTags: ingredient.allergenTags,
          type: typeof ingredient.allergenTags
        });
        
        // Process like admin endpoint
        const translatedIngredient = translateIngredient(ingredient, language);
        
        const finalResult = {
          id: ingredient.id,
          name: translatedIngredient.name,
          description: translatedIngredient.description,
          category: ingredient.category?.name?.toLowerCase() || "other",
          allergen_tags: translatedIngredient.allergen_tags,
        };
        
        console.log('Final admin endpoint result:', finalResult);
        console.log(`Has allergens: ${finalResult.allergen_tags && finalResult.allergen_tags.length > 0}`);
      } else {
        console.log(`❌ ${testName} not found in database`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminEndpoint();
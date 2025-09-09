import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MongoDB seed...');

  try {
    // Check if data already exists
    const existingDishes = await prisma.dish.count();
    const existingCategories = await prisma.category.count();
    
    if (existingDishes > 0 || existingCategories > 0) {
      console.log('✅ Data already exists, skipping seed');
      console.log(`Found ${existingDishes} dishes and ${existingCategories} categories`);
      return;
    }
    // Create test categories
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Proteins',
          description: 'Meat, fish, and protein sources',
          color: '#ef4444',
          icon: '🥩'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Dairy',
          description: 'Milk products and derivatives',
          color: '#f97316',
          icon: '🥛'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Grains',
          description: 'Cereals, bread, and grain products',
          color: '#eab308',
          icon: '🌾'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Vegetables',
          description: 'Fresh vegetables and herbs',
          color: '#22c55e',
          icon: '🥗'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Fruits',
          description: 'Fresh and dried fruits',
          color: '#06b6d4',
          icon: '🍎'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Nuts',
          description: 'Nuts, seeds, and tree nuts',
          color: '#8b5cf6',
          icon: '🥜'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Spices',
          description: 'Herbs, spices, and seasonings',
          color: '#ec4899',
          icon: '🌿'
        }
      })
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create test ingredients
    const ingredients = await Promise.all([
      // Proteins
      prisma.ingredient.create({
        data: {
          name: 'Chicken Breast',
          categoryId: categories[0].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Salmon',
          categoryId: categories[0].id,
          allergenTags: JSON.stringify(['fish'])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Ground Beef',
          categoryId: categories[0].id,
          allergenTags: JSON.stringify([])
        }
      }),
      
      // Dairy
      prisma.ingredient.create({
        data: {
          name: 'Mozzarella',
          categoryId: categories[1].id,
          allergenTags: JSON.stringify(['dairy'])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Greek Yogurt',
          categoryId: categories[1].id,
          allergenTags: JSON.stringify(['dairy'])
        }
      }),
      
      // Grains
      prisma.ingredient.create({
        data: {
          name: 'Quinoa',
          categoryId: categories[2].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Whole Wheat Pasta',
          categoryId: categories[2].id,
          allergenTags: JSON.stringify(['gluten'])
        }
      }),
      
      // Vegetables
      prisma.ingredient.create({
        data: {
          name: 'Spinach',
          categoryId: categories[3].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Cherry Tomatoes',
          categoryId: categories[3].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Red Bell Pepper',
          categoryId: categories[3].id,
          allergenTags: JSON.stringify([])
        }
      }),
      
      // Fruits
      prisma.ingredient.create({
        data: {
          name: 'Avocado',
          categoryId: categories[4].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Blueberries',
          categoryId: categories[4].id,
          allergenTags: JSON.stringify([])
        }
      }),
      
      // Nuts
      prisma.ingredient.create({
        data: {
          name: 'Almonds',
          categoryId: categories[5].id,
          allergenTags: JSON.stringify(['nuts'])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Walnuts',
          categoryId: categories[5].id,
          allergenTags: JSON.stringify(['nuts'])
        }
      }),
      
      // Spices
      prisma.ingredient.create({
        data: {
          name: 'Basil',
          categoryId: categories[6].id,
          allergenTags: JSON.stringify([])
        }
      }),
      prisma.ingredient.create({
        data: {
          name: 'Black Pepper',
          categoryId: categories[6].id,
          allergenTags: JSON.stringify([])
        }
      })
    ]);

    console.log(`✅ Created ${ingredients.length} ingredients`);

    // Create sample dishes
    const dishes = await Promise.all([
      prisma.dish.create({
        data: {
          name: 'Grilled Chicken Salad',
          description: 'Fresh salad with grilled chicken breast, spinach, cherry tomatoes, and avocado',
          price: 14.50,
          category: 'Salads',
          allergenTags: JSON.stringify([]),
          isModifiable: true,
          modificationNote: 'Can be made without chicken for vegetarian option',
          components: JSON.stringify(['chicken_breast', 'spinach', 'cherry_tomatoes', 'avocado'])
        }
      }),
      prisma.dish.create({
        data: {
          name: 'Salmon Quinoa Bowl',
          description: 'Baked salmon with quinoa, vegetables, and herbs',
          price: 18.90,
          category: 'Bowls',
          allergenTags: JSON.stringify(['fish']),
          isModifiable: true,
          modificationNote: 'Salmon can be substituted with chicken',
          components: JSON.stringify(['salmon', 'quinoa', 'red_bell_pepper', 'spinach'])
        }
      })
    ]);

    console.log(`✅ Created ${dishes.length} dishes`);

    console.log('🎉 MongoDB seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

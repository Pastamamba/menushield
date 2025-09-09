import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedIngredientsAndCategories() {
  console.log("Seeding categories...");

  // Create categories first
  const categories = [
    {
      name: "Proteins",
      description: "Meat, fish, and protein sources",
      color: "#DC2626",
      icon: "🥩",
    },
    {
      name: "Dairy",
      description: "Milk, cheese, and dairy products",
      color: "#3B82F6",
      icon: "🥛",
    },
    {
      name: "Grains",
      description: "Wheat, rice, and grain products",
      color: "#F59E0B",
      icon: "🌾",
    },
    {
      name: "Vegetables",
      description: "Fresh vegetables and herbs",
      color: "#10B981",
      icon: "🥬",
    },
    {
      name: "Fruits",
      description: "Fresh and dried fruits",
      color: "#8B5CF6",
      icon: "🍎",
    },
    {
      name: "Nuts",
      description: "Tree nuts and seeds",
      color: "#92400E",
      icon: "🥜",
    },
    {
      name: "Spices",
      description: "Herbs and spices",
      color: "#059669",
      icon: "🌿",
    },
  ];

  const createdCategories = {};
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: categoryData,
      create: categoryData,
    });
    createdCategories[categoryData.name] = category.id;
    console.log(`Created category: ${category.name}`);
  }

  console.log("Seeding ingredients...");

  // Create ingredients
  const ingredients = [
    // Proteins
    {
      name: "Chicken Breast",
      categoryId: createdCategories.Proteins,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Salmon",
      categoryId: createdCategories.Proteins,
      allergenTags: JSON.stringify(["fish"]),
    },
    {
      name: "Ground Beef",
      categoryId: createdCategories.Proteins,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Eggs",
      categoryId: createdCategories.Proteins,
      allergenTags: JSON.stringify(["eggs"]),
    },

    // Dairy
    {
      name: "Mozzarella Cheese",
      categoryId: createdCategories.Dairy,
      allergenTags: JSON.stringify(["dairy"]),
    },
    {
      name: "Milk",
      categoryId: createdCategories.Dairy,
      allergenTags: JSON.stringify(["dairy"]),
    },
    {
      name: "Butter",
      categoryId: createdCategories.Dairy,
      allergenTags: JSON.stringify(["dairy"]),
    },

    // Grains
    {
      name: "Wheat Flour",
      categoryId: createdCategories.Grains,
      allergenTags: JSON.stringify(["gluten", "wheat"]),
    },
    {
      name: "Rice",
      categoryId: createdCategories.Grains,
      allergenTags: JSON.stringify([]),
    },

    // Vegetables
    {
      name: "Tomatoes",
      categoryId: createdCategories.Vegetables,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Fresh Basil",
      categoryId: createdCategories.Vegetables,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Mixed Greens",
      categoryId: createdCategories.Vegetables,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Cucumber",
      categoryId: createdCategories.Vegetables,
      allergenTags: JSON.stringify([]),
    },

    // Nuts
    {
      name: "Walnuts",
      categoryId: createdCategories.Nuts,
      allergenTags: JSON.stringify(["nuts", "tree-nuts"]),
    },

    // Spices
    {
      name: "Salt",
      categoryId: createdCategories.Spices,
      allergenTags: JSON.stringify([]),
    },
    {
      name: "Black Pepper",
      categoryId: createdCategories.Spices,
      allergenTags: JSON.stringify([]),
    },
  ];

  for (const ingredientData of ingredients) {
    const ingredient = await prisma.ingredient.upsert({
      where: {
        id: `temp_${ingredientData.name.replace(/\s+/g, "_").toLowerCase()}`,
      },
      update: ingredientData,
      create: ingredientData,
    });
    console.log(`Created ingredient: ${ingredient.name}`);
  }

  console.log("Seed completed successfully!");
}

seedIngredientsAndCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

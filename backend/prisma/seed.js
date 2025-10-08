import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.dishIngredient.deleteMany({});
  await prisma.dish.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.restaurant.deleteMany({});

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "MenuShield Demo Restaurant",
      description: "A safe dining experience for everyone",
      contact: "contact@menushield.com",
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Proteins",
        description: "Meat, fish, and plant-based proteins",
        color: "#ef4444",
      },
    }),
    prisma.category.create({
      data: {
        name: "Vegetables",
        description: "Fresh vegetables and herbs",
        color: "#22c55e",
      },
    }),
    prisma.category.create({
      data: {
        name: "Grains",
        description: "Bread, pasta, and cereals",
        color: "#f59e0b",
      },
    }),
    prisma.category.create({
      data: {
        name: "Dairy",
        description: "Milk, cheese, and dairy products",
        color: "#3b82f6",
      },
    }),
  ]);

  // Create ingredients
  const ingredients = await Promise.all([
    // Proteins
    prisma.ingredient.create({
      data: {
        name: "Atlantic Salmon",
        categoryId: categories[0].id,
        allergenTags: JSON.stringify(["fish"]),
      },
    }),
    prisma.ingredient.create({
      data: {
        name: "Chicken Breast",
        categoryId: categories[0].id,
        allergenTags: JSON.stringify([]),
      },
    }),
    // Vegetables
    prisma.ingredient.create({
      data: {
        name: "Fresh Basil",
        categoryId: categories[1].id,
        allergenTags: JSON.stringify([]),
      },
    }),
    prisma.ingredient.create({
      data: {
        name: "Cherry Tomatoes",
        categoryId: categories[1].id,
        allergenTags: JSON.stringify([]),
      },
    }),
    prisma.ingredient.create({
      data: {
        name: "Mixed Greens",
        categoryId: categories[1].id,
        allergenTags: JSON.stringify([]),
      },
    }),
    // Grains
    prisma.ingredient.create({
      data: {
        name: "Pizza Dough",
        categoryId: categories[2].id,
        allergenTags: JSON.stringify(["gluten"]),
      },
    }),
    // Dairy
    prisma.ingredient.create({
      data: {
        name: "Mozzarella Cheese",
        categoryId: categories[3].id,
        allergenTags: JSON.stringify(["dairy"]),
      },
    }),
    prisma.ingredient.create({
      data: {
        name: "Butter",
        categoryId: categories[3].id,
        allergenTags: JSON.stringify(["dairy"]),
      },
    }),
  ]);

  // Create dishes
  const dishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: "Margherita Pizza",
        description:
          "Classic pizza with fresh mozzarella, tomato sauce, and basil",
        price: 16.99,
        category: "Main Course",
        allergenTags: JSON.stringify(["gluten", "dairy"]),
        modificationNote: "Can be made dairy-free by removing cheese",
        isModifiable: true,
        components: JSON.stringify([
          {
            id: "1-base",
            name: "Pizza Base",
            type: "base",
            ingredients: ["pizza dough", "olive oil"],
            allergen_tags: ["gluten"],
            is_required: true,
          },
          {
            id: "1-sauce",
            name: "Tomato Sauce",
            type: "sauce",
            ingredients: ["crushed tomatoes", "garlic", "herbs"],
            allergen_tags: [],
            is_required: false,
          },
          {
            id: "1-protein",
            name: "Mozzarella Cheese",
            type: "protein",
            ingredients: ["mozzarella cheese"],
            allergen_tags: ["dairy"],
            is_required: false,
          },
          {
            id: "1-garnish",
            name: "Fresh Basil",
            type: "garnish",
            ingredients: ["fresh basil"],
            allergen_tags: [],
            is_required: false,
          },
        ]),
      },
    }),
    prisma.dish.create({
      data: {
        name: "Garden Salad",
        description:
          "Fresh mixed greens with cherry tomatoes, cucumber, and walnuts",
        price: 12.99,
        category: "Appetizers",
        allergenTags: JSON.stringify(["nuts"]),
        modificationNote: "Can remove nuts upon request",
        isModifiable: true,
        components: JSON.stringify([
          {
            id: "2-base",
            name: "Mixed Greens",
            type: "base",
            ingredients: ["mixed greens", "cherry tomatoes", "cucumber"],
            allergen_tags: [],
            is_required: true,
          },
          {
            id: "2-garnish",
            name: "Walnuts",
            type: "garnish",
            ingredients: ["walnuts"],
            allergen_tags: ["nuts"],
            is_required: false,
          },
        ]),
      },
    }),
    prisma.dish.create({
      data: {
        name: "Grilled Salmon",
        description:
          "Atlantic salmon with lemon herb butter and seasonal vegetables",
        price: 24.99,
        category: "Main Course",
        allergenTags: JSON.stringify(["fish", "dairy"]),
        modificationNote: "Can be prepared without butter (olive oil instead)",
        isModifiable: true,
        components: JSON.stringify([
          {
            id: "3-protein",
            name: "Grilled Salmon",
            type: "protein",
            ingredients: ["atlantic salmon", "salt", "pepper"],
            allergen_tags: ["fish"],
            is_required: true,
          },
          {
            id: "3-sauce",
            name: "Lemon Herb Butter",
            type: "sauce",
            ingredients: ["butter", "lemon juice", "fresh herbs"],
            allergen_tags: ["dairy"],
            is_required: false,
          },
        ]),
      },
    }),
  ]);

  // Create demo user
  const hashedPassword = await bcrypt.hash("supersecret", 10);
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: hashedPassword,
      restaurantName: "MenuShield Demo Restaurant",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${categories.length} categories`);
  console.log(`Created ${ingredients.length} ingredients`);
  console.log(`Created ${dishes.length} dishes`);
  console.log(`Created 1 restaurant and 1 demo user`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// database.js - Simple JSON file-based database with proper structure
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database directory
const dbDir = path.join(__dirname, "db");
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Database files
const files = {
  dishes: path.join(dbDir, "dishes.json"),
  ingredients: path.join(dbDir, "ingredients.json"),
  categories: path.join(dbDir, "categories.json"),
  restaurant: path.join(dbDir, "restaurant.json"),
  users: path.join(dbDir, "users.json"),
};

// Helper functions
function readJSONFile(filePath, defaultValue = []) {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJSONFile(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Initialize database with sample data
function initializeDatabase() {
  console.log("Initializing database...");

  // Initialize dishes
  if (!existsSync(files.dishes)) {
    const sampleDishes = [
      {
        id: "1",
        name: "Margherita Pizza",
        description:
          "Classic pizza with fresh mozzarella, tomato sauce, and basil",
        price: 16.99,
        category: "Main Course",
        ingredients: [
          "pizza dough",
          "tomato sauce",
          "mozzarella cheese",
          "fresh basil",
          "olive oil",
        ],
        allergen_tags: ["gluten", "dairy"],
        modification_note: "Can be made dairy-free by removing cheese",
        is_modifiable: true,
        components: [
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
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Garden Salad",
        description:
          "Fresh mixed greens with cherry tomatoes, cucumber, and walnuts",
        price: 12.99,
        category: "Appetizers",
        ingredients: [
          "mixed greens",
          "cherry tomatoes",
          "cucumber",
          "red onion",
          "walnuts",
          "olive oil",
          "balsamic vinegar",
        ],
        allergen_tags: ["nuts", "mustard"],
        modification_note: "Can remove nuts upon request",
        is_modifiable: true,
        components: [
          {
            id: "2-base",
            name: "Mixed Greens",
            type: "base",
            ingredients: [
              "mixed greens",
              "cherry tomatoes",
              "cucumber",
              "red onion",
            ],
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
          {
            id: "2-sauce",
            name: "Vinaigrette",
            type: "sauce",
            ingredients: ["olive oil", "balsamic vinegar", "dijon mustard"],
            allergen_tags: ["mustard"],
            is_required: false,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Grilled Salmon",
        description:
          "Atlantic salmon with lemon herb butter and seasonal vegetables",
        price: 24.99,
        category: "Main Course",
        ingredients: [
          "atlantic salmon",
          "butter",
          "lemon juice",
          "fresh herbs",
          "broccoli",
          "carrots",
        ],
        allergen_tags: ["fish", "dairy"],
        modification_note: "Can be prepared without butter (olive oil instead)",
        is_modifiable: true,
        components: [
          {
            id: "4-protein",
            name: "Grilled Salmon",
            type: "protein",
            ingredients: ["atlantic salmon", "salt", "pepper"],
            allergen_tags: ["fish"],
            is_required: true,
          },
          {
            id: "4-sauce",
            name: "Lemon Herb Butter",
            type: "sauce",
            ingredients: ["butter", "lemon juice", "fresh herbs"],
            allergen_tags: ["dairy"],
            is_required: false,
          },
          {
            id: "4-side",
            name: "Seasonal Vegetables",
            type: "side",
            ingredients: ["broccoli", "carrots", "zucchini"],
            allergen_tags: [],
            is_required: false,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    writeJSONFile(files.dishes, sampleDishes);
  }

  // Initialize restaurant info
  if (!existsSync(files.restaurant)) {
    const restaurantInfo = {
      name: "Demo Restaurant",
      description:
        "A family-friendly restaurant committed to safe dining for all",
      contact: "(555) 123-4567",
      updated_at: new Date().toISOString(),
    };
    writeJSONFile(files.restaurant, restaurantInfo);
  }

  // Initialize ingredient categories
  if (!existsSync(files.categories)) {
    const categories = [
      {
        id: "proteins",
        name: "Proteins",
        description: "Meat, fish, and protein sources",
        color: "#EF4444",
        icon: "🥩",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "dairy",
        name: "Dairy",
        description: "Milk products and cheese",
        color: "#3B82F6",
        icon: "🥛",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "grains",
        name: "Grains",
        description: "Wheat, rice, and grain products",
        color: "#F59E0B",
        icon: "🌾",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    writeJSONFile(files.categories, categories);
  }

  // Initialize ingredients
  if (!existsSync(files.ingredients)) {
    const ingredients = [
      {
        id: "mozzarella",
        name: "Mozzarella Cheese",
        category: "dairy",
        parent_id: null,
        allergen_tags: ["dairy"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "salmon",
        name: "Atlantic Salmon",
        category: "proteins",
        parent_id: null,
        allergen_tags: ["fish"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    writeJSONFile(files.ingredients, ingredients);
  }

  // Initialize users
  if (!existsSync(files.users)) {
    const users = [
      {
        id: 1,
        email: "admin@example.com",
        password_hash: "supersecret", // In production, use proper hashing
        restaurant_name: "Demo Restaurant",
        created_at: new Date().toISOString(),
      },
    ];
    writeJSONFile(files.users, users);
  }

  console.log("Database initialized");
}

// Database operations
export const dishOperations = {
  getAll: () => {
    return readJSONFile(files.dishes, []);
  },

  getById: (id) => {
    const dishes = readJSONFile(files.dishes, []);
    return dishes.find((dish) => dish.id === id) || null;
  },

  create: (dishData) => {
    const dishes = readJSONFile(files.dishes, []);
    const newDish = {
      id: generateId(),
      ...dishData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dishes.push(newDish);

    if (writeJSONFile(files.dishes, dishes)) {
      return newDish;
    }
    return null;
  },

  update: (id, dishData) => {
    const dishes = readJSONFile(files.dishes, []);
    const dishIndex = dishes.findIndex((dish) => dish.id === id);

    if (dishIndex === -1) return null;

    dishes[dishIndex] = {
      ...dishes[dishIndex],
      ...dishData,
      updated_at: new Date().toISOString(),
    };

    if (writeJSONFile(files.dishes, dishes)) {
      return dishes[dishIndex];
    }
    return null;
  },

  delete: (id) => {
    const dishes = readJSONFile(files.dishes, []);
    const dishIndex = dishes.findIndex((dish) => dish.id === id);

    if (dishIndex === -1) return false;

    dishes.splice(dishIndex, 1);
    return writeJSONFile(files.dishes, dishes);
  },
};

export const ingredientOperations = {
  getAll: () => {
    return readJSONFile(files.ingredients, []);
  },

  getById: (id) => {
    const ingredients = readJSONFile(files.ingredients, []);
    return ingredients.find((ingredient) => ingredient.id === id) || null;
  },

  create: (ingredientData) => {
    const ingredients = readJSONFile(files.ingredients, []);
    const newIngredient = {
      id: generateId(),
      ...ingredientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ingredients.push(newIngredient);

    if (writeJSONFile(files.ingredients, ingredients)) {
      return newIngredient;
    }
    return null;
  },

  update: (id, ingredientData) => {
    const ingredients = readJSONFile(files.ingredients, []);
    const ingredientIndex = ingredients.findIndex(
      (ingredient) => ingredient.id === id
    );

    if (ingredientIndex === -1) return null;

    ingredients[ingredientIndex] = {
      ...ingredients[ingredientIndex],
      ...ingredientData,
      updated_at: new Date().toISOString(),
    };

    if (writeJSONFile(files.ingredients, ingredients)) {
      return ingredients[ingredientIndex];
    }
    return null;
  },

  delete: (id) => {
    const ingredients = readJSONFile(files.ingredients, []);

    // Check if this ingredient has children
    const children = ingredients.filter((ing) => ing.parent_id === id);
    if (children.length > 0) {
      throw new Error("Cannot delete ingredient that has child ingredients");
    }

    const ingredientIndex = ingredients.findIndex(
      (ingredient) => ingredient.id === id
    );
    if (ingredientIndex === -1) return false;

    ingredients.splice(ingredientIndex, 1);
    return writeJSONFile(files.ingredients, ingredients);
  },
};

export const categoryOperations = {
  getAll: () => {
    return readJSONFile(files.categories, []);
  },

  getById: (id) => {
    const categories = readJSONFile(files.categories, []);
    return categories.find((category) => category.id === id) || null;
  },

  create: (categoryData) => {
    const categories = readJSONFile(files.categories, []);
    const newCategory = {
      id: generateId(),
      ...categoryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    categories.push(newCategory);

    if (writeJSONFile(files.categories, categories)) {
      return newCategory;
    }
    return null;
  },

  update: (id, categoryData) => {
    const categories = readJSONFile(files.categories, []);
    const categoryIndex = categories.findIndex(
      (category) => category.id === id
    );

    if (categoryIndex === -1) return null;

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...categoryData,
      updated_at: new Date().toISOString(),
    };

    if (writeJSONFile(files.categories, categories)) {
      return categories[categoryIndex];
    }
    return null;
  },

  delete: (id) => {
    const categories = readJSONFile(files.categories, []);
    const ingredients = readJSONFile(files.ingredients, []);

    // Check if this category is used by ingredients
    const category = categories.find((cat) => cat.id === id);
    if (category) {
      const inUse = ingredients.some(
        (ing) => ing.category === category.name.toLowerCase()
      );
      if (inUse) {
        throw new Error("Cannot delete category that is in use by ingredients");
      }
    }

    const categoryIndex = categories.findIndex(
      (category) => category.id === id
    );
    if (categoryIndex === -1) return false;

    categories.splice(categoryIndex, 1);
    return writeJSONFile(files.categories, categories);
  },
};

export const restaurantOperations = {
  get: () => {
    return readJSONFile(files.restaurant, {
      name: "Demo Restaurant",
      description:
        "A family-friendly restaurant committed to safe dining for all",
      contact: "(555) 123-4567",
    });
  },

  update: (data) => {
    const restaurant = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (writeJSONFile(files.restaurant, restaurant)) {
      return restaurant;
    }
    return null;
  },
};

export const userOperations = {
  findByEmail: (email) => {
    const users = readJSONFile(files.users, []);
    return users.find((user) => user.email === email) || null;
  },

  create: (userData) => {
    const users = readJSONFile(files.users, []);
    const newUser = {
      id: users.length + 1,
      ...userData,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);

    if (writeJSONFile(files.users, users)) {
      return newUser.id;
    }
    return null;
  },
};

// Initialize database
initializeDatabase();

console.log("JSON-based database ready");

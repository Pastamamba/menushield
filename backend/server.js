import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Only log in development
const isDev = process.env.NODE_ENV !== "production";
if (isDev) {
  console.log("🔧 Environment check:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", process.env.PORT);
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
}

// Force production to use MongoDB ingredients - v2.1
console.log("🎯 MenuShield v2.1 - Using MongoDB ingredient database");
console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 50) + "...");

const prisma = new PrismaClient();
const app = express();

// Helper to safely parse allergenTags as array
function safeParseArray(val) {
  // If already an array, return as-is
  if (Array.isArray(val)) return val;
  
  // If null or undefined, return empty array
  if (!val) return [];
  
  if (typeof val === "string") {
    // Handle double-encoded JSON strings like "["fish"]" 
    let cleanVal = val.trim();
    
    // If string starts and ends with quotes and contains JSON array, remove outer quotes
    if (cleanVal.startsWith('"') && cleanVal.endsWith('"') && cleanVal.includes('[')) {
      cleanVal = cleanVal.slice(1, -1); // Remove outer quotes
    }
    
    try {
      const parsed = JSON.parse(cleanVal);
      const result = Array.isArray(parsed) ? parsed : [parsed];
      return result;
    } catch (e) {
      return [val]; // If all parsing fails, return original as single item
    }
  }
  
  // Handle MongoDB/Prisma array-like objects
  if (val && typeof val === "object" && "length" in val) {
    return Array.from(val);
  }
  
  // Handle plain objects with array values
  if (val && typeof val === "object") {
    return Object.values(val).filter((v) => typeof v === "string");
  }
  
  return [];
}

// Helper to get translated content from translations JSON field
function getTranslatedContent(
  entity,
  language,
  field = "name",
  fallbackLanguage = "en"
) {
  if (!entity) return "";

  // If no translations field, return the original field
  if (!entity.translations) {
    return entity[field] || "";
  }

  try {
    // Handle both object and string formats
    let translations = entity.translations;
    if (typeof translations === "string") {
      translations = JSON.parse(translations);
    }

    // Check for nested field structure: translations[field][language]
    if (translations[field] && translations[field][language]) {
      return translations[field][language];
    }

    // Check for direct language structure: translations[language][field]
    if (translations[language] && translations[language][field]) {
      return translations[language][field];
    }

    // Fallback to English
    if (translations[field] && translations[field][fallbackLanguage]) {
      return translations[field][fallbackLanguage];
    }
    if (
      translations[fallbackLanguage] &&
      translations[fallbackLanguage][field]
    ) {
      return translations[fallbackLanguage][field];
    }
  } catch (e) {
    if (isDev) console.warn("Translation parsing error:", e);
  }

  // Fallback to original field
  return entity[field] || "";
}

// Helper to translate dish with all fields
function translateDish(dish, language) {
  const translated = {
    ...dish,
    name: getTranslatedContent(dish, language, "name"),
    description: getTranslatedContent(dish, language, "description"),
    modificationNote:
      getTranslatedContent(dish, language, "modification_note") ||
      dish.modification_note ||
      dish.modificationNote,
  };

  // Translate components if they exist
  if (dish.components && Array.isArray(dish.components)) {
    translated.components = dish.components.map((component) => ({
      ...component,
      name: component.translations
        ? getTranslatedContent(component, language, "name")
        : component.name,
      description: component.translations
        ? getTranslatedContent(component, language, "description")
        : component.description || "",
    }));
  }

  return translated;
}

// Helper to translate ingredient
function translateIngredient(ingredient, language) {
  return {
    ...ingredient,
    name: getTranslatedContent(ingredient, language, "name"),
    description: getTranslatedContent(ingredient, language, "description"),
    allergen_tags: safeParseArray(ingredient.allergenTags), // Parse JSON string to array
  };
}

// Validate JWT_SECRET in production
if (
  !isDev &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "replace_with_strong_secret")
) {
  console.error("⚠️ CRITICAL: Set a strong JWT_SECRET in production!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || "replace_with_strong_secret";
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// Trust proxy for proper rate limiting in production (Netlify, Heroku, etc.)
app.set("trust proxy", 1);

app.use(compression());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://menushield.netlify.app",
            "https://menushield-production.up.railway.app",
          ]
        : [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
          ],
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    if (isDev) console.log("Health check requested");
    // Test database connection with MongoDB
    await prisma.$connect();
    if (isDev) console.log("Database connection OK");
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      env: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Simple test endpoint that doesn't need database
app.get("/ping", (req, res) => {
  if (isDev) console.log("Ping received");
  res.status(200).json({
    message: "pong",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Manual seed endpoint for testing
app.post("/api/seed", async (req, res) => {
  try {
    if (isDev) console.log("Manual seed requested");

    // Check if categories exist
    const existingCategories = await prisma.category.count();
    if (existingCategories === 0) {
      // Create categories
      const categories = [
        {
          name: "Appetizers",
          description: "Start your meal with these delicious appetizers",
          color: "#ff6b6b",
        },
        {
          name: "Salads",
          description: "Fresh and healthy salad options",
          color: "#4ecdc4",
        },
        {
          name: "Main Course",
          description: "Hearty main dishes",
          color: "#45b7d1",
        },
        { name: "Pizza", description: "Wood-fired pizzas", color: "#feca57" },
        {
          name: "Bowls",
          description: "Healthy bowl options",
          color: "#ff9ff3",
        },
        {
          name: "Desserts",
          description: "Sweet treats to end your meal",
          color: "#54a0ff",
        },
        {
          name: "Beverages",
          description: "Drinks and refreshments",
          color: "#5f27cd",
        },
      ];

      for (const category of categories) {
        await prisma.category.create({ data: category });
      }
      if (isDev) console.log(`✅ Created ${categories.length} categories`);
    }

    // Check if ingredients exist - DISABLED: Using pre-populated MongoDB data
    const existingIngredients = await prisma.ingredient.count();
    console.log(`🎯 Found ${existingIngredients} ingredients in Ingredient collection`);
    // Skip auto-creation - using pre-populated data

    // Check if admin user exists
    const existingUsers = await prisma.user.count();
    if (existingUsers === 0) {
      // Create admin user
      const adminUser = {
        email: process.env.ADMIN_EMAIL || "admin@menushield.com",
        passwordHash: process.env.ADMIN_PASSWORD || "admin123",
        restaurantName: "MenuShield Demo Restaurant",
      };

      await prisma.user.create({ data: adminUser });
      if (isDev) console.log("✅ Created admin user");
    }

    // Check if more dishes are needed
    const existingDishes = await prisma.dish.count();
    if (existingDishes < 5) {
      // Create additional sample dishes
      const sampleDishes = [
        {
          name: "Margherita Pizza",
          description: "Classic tomato sauce, mozzarella, fresh basil",
          price: 12.9,
          category: "Pizza",
          allergenTags: JSON.stringify(["dairy", "gluten"]),
          isModifiable: true,
          modificationNote: "Can be made vegan with dairy-free cheese",
        },
        {
          name: "Caesar Salad",
          description: "Romaine lettuce, parmesan, croutons, caesar dressing",
          price: 10.5,
          category: "Salads",
          allergenTags: JSON.stringify(["dairy", "eggs", "gluten"]),
          isModifiable: true,
          modificationNote: "Can be made without croutons for gluten-free",
        },
        {
          name: "Chicken Teriyaki Bowl",
          description:
            "Grilled chicken with teriyaki sauce, rice, and vegetables",
          price: 15.9,
          category: "Bowls",
          allergenTags: JSON.stringify(["soy"]),
          isModifiable: true,
          modificationNote: "Can substitute chicken with tofu",
        },
      ];

      for (const dish of sampleDishes) {
        // Check if dish already exists
        const existing = await prisma.dish.findFirst({
          where: { name: dish.name },
        });
        if (!existing) {
          await prisma.dish.create({ data: dish });
        }
      }
      if (isDev) console.log(`✅ Added sample dishes`);
    }

    const stats = {
      categories: await prisma.category.count(),
      ingredients: await prisma.ingredient.count(),
      dishes: await prisma.dish.count(),
      users: await prisma.user.count(),
    };

    res.json({
      message: "Database seeded successfully",
      stats,
      seeded: true,
    });
  } catch (error) {
    console.error("Seed error:", error);
    res
      .status(500)
      .json({ error: "Failed to seed database", details: error.message });
  }
});

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://menushield.netlify.app",
            "https://menushield-production.netlify.app",
          ] // Päivitetään Netlify URL:llä
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            /^http:\/\/localhost:\d+$/,
          ],
    credentials: true,
  })
);

// Database connection test
async function testConnection() {
  try {
    await prisma.$connect();
    if (isDev) console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

// Short URL redirect handler
app.get("/m/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;
  res.redirect(`/menu?rid=${restaurantId}`);
});

// Public: fetch menu (filtered for guest view)
app.get("/api/menu", async (req, res) => {
  try {
    // Legacy endpoint - default to demo-restaurant if no restaurant specified
    const restaurantSlug =
      req.query.r || req.query.restaurant || "demo-restaurant";
    const language = req.query.lang || req.query.language || "en"; // Get language parameter

    // Find restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: { id: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Get dishes only for this restaurant
    let dishes;
    try {
      dishes = await prisma.dish.findMany({
        where: {
          restaurantId: restaurant.id,
          isActive: true,
        },
        include: {
          dishIngredients: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { displayOrder: "asc" },
      });

      // Filter out any dishIngredients with null ingredients after fetch
      dishes = dishes.map(dish => ({
        ...dish,
        dishIngredients: dish.dishIngredients?.filter(di => di.ingredient) || []
      }));

    } catch (includeError) {
      console.error("Error fetching public dishes with ingredients, falling back to basic fetch:", includeError);
      
      // Fallback to basic fetch without ingredients
      dishes = await prisma.dish.findMany({
        where: {
          restaurantId: restaurant.id,
          isActive: true,
        },
        orderBy: { displayOrder: "asc" },
      });

      console.log("Public menu fallback: Found", dishes.length, "dishes, now fetching ingredients manually");

      // Manually fetch ingredients for each dish
      for (let dish of dishes) {
        try {
          const dishIngredients = await prisma.dishIngredient.findMany({
            where: { dishId: dish.id },
            include: { ingredient: true }
          });
          
          // Filter out null ingredients and attach to dish
          dish.dishIngredients = dishIngredients.filter(di => di.ingredient);
          console.log(`Public menu fallback: Dish ${dish.name} has ${dish.dishIngredients.length} ingredients`);
        } catch (ingredientError) {
          console.error(`Public menu fallback: Error fetching ingredients for dish ${dish.name}:`, ingredientError);
          dish.dishIngredients = [];
        }
      }
    }

    // Transform for guest view with translation support
    const guestMenu = dishes.map((dish) => {
      // Translate the dish based on language parameter
      const translatedDish = translateDish(dish, language);

      let allergenTags;
      try {
        allergenTags = safeParseArray(dish.allergenTags);
        // Extra check - force array
        if (!Array.isArray(allergenTags)) {
          allergenTags = [];
        }
      } catch (e) {
        console.error("Allergen parsing error for dish", dish.name, ":", e);
        allergenTags = [];
      }

      let components;
      try {
        components = safeParseArray(dish.components);
        if (!Array.isArray(components)) {
          components = [];
        }
        // Translate component names
        components = components.map((comp) => ({
          ...comp,
          name: comp.translations
            ? getTranslatedContent(comp, language, "name")
            : comp.name,
          description: comp.translations
            ? getTranslatedContent(comp, language, "description")
            : comp.description || "",
        }));
      } catch (e) {
        console.error("Components parsing error for dish", dish.name, ":", e);
        components = [];
      }

      let ingredients;
      try {
        ingredients = dish.dishIngredients 
          ? dish.dishIngredients
              .filter(di => di.ingredient && di.ingredient.name) // Filter out null ingredients
              .map(di => di.ingredient.name)
          : [];
        if (!Array.isArray(ingredients)) {
          ingredients = [];
        }
      } catch (e) {
        console.error("Ingredients parsing error for dish", dish.name, ":", e);
        ingredients = [];
      }

      return {
        id: dish.id,
        name: translatedDish.name,
        description: translatedDish.description,
        price: dish.price,
        category: dish.category,
        ingredients: ingredients,
        allergen_tags: allergenTags,
        modification_note: translatedDish.modificationNote,
        is_modifiable: dish.isModifiable,
        components: components,
      };
    });

    res.json(guestMenu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Public: fetch categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Public: fetch ingredients
app.get("/api/ingredients", async (req, res) => {
  try {
    const language = req.query.lang || req.query.language || "en"; // Get language parameter

    const ingredients = await prisma.ingredient.findMany({
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    // Translate ingredients based on language parameter
    const translatedIngredients = ingredients.map((ingredient) =>
      translateIngredient(ingredient, language)
    );

    res.json(translatedIngredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// Public: fetch restaurant info
app.get("/api/restaurant", async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findFirst();
    res.json(
      restaurant || {
        name: "MenuShield Restaurant",
        description: "Welcome to our restaurant",
        showPrices: true,
        currency: "SEK", // Default to Swedish Krona for Swedish market
      }
    );
  } catch (error) {
    console.error("Error fetching restaurant info:", error);
    res.status(500).json({ error: "Failed to fetch restaurant info" });
  }
});

// Admin: update restaurant settings
app.put("/api/admin/restaurant", requireAuth, async (req, res) => {
  try {
    const { name, description, contact, showPrices, currency } = req.body;

    console.log("Updating restaurant settings:", {
      name,
      description,
      contact,
      showPrices,
      currency,
    });

    // Update the user's restaurant
    const restaurant = await prisma.restaurant.update({
      where: { id: req.user.restaurantId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(contact !== undefined && { contact }),
        ...(showPrices !== undefined && { showPrices }),
        ...(currency && { currency }),
      },
    });

    console.log("Restaurant updated successfully:", restaurant);
    res.json(restaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ error: "Failed to update restaurant settings" });
  }
});

// Input validation middleware
const validateEmail = body("email").isEmail().normalizeEmail();
const validatePassword = body("password").isLength({ min: 6 }).trim();
const validateRestaurantName = body("restaurantName")
  .isLength({ min: 1, max: 100 })
  .trim();
const validateFirstName = body("firstName").optional().isLength({ max: 50 }).trim();
const validateLastName = body("lastName").optional().isLength({ max: 50 }).trim();
const validateDishInput = [
  body("name").isLength({ min: 1, max: 200 }).trim(),
  body("description").optional().isLength({ max: 500 }).trim(),
  body("price").optional().toFloat().isFloat({ min: 0 }),
  body("category").optional().isLength({ max: 100 }).trim(),
  body("allergen_tags").optional().isArray(),
  body("ingredients").optional().isArray(),
  body("components").optional().isArray(),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Admin: login
app.post(
  "/api/login",
  authLimiter,
  [validateEmail, validatePassword],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check demo credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Find the demo restaurant for demo login
        const demoRestaurant = await prisma.restaurant.findUnique({
          where: { slug: "demo-restaurant" },
        });

        const token = jwt.sign(
          {
            email,
            restaurantId: demoRestaurant?.id || null,
            role: "OWNER",
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.json({ token });
      }

      // Check database users
      const user = await prisma.user.findUnique({
        where: { email },
        include: { restaurant: true }, // Include restaurant data
      });

      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        const token = jwt.sign(
          {
            email: user.email,
            userId: user.id,
            restaurantId: user.restaurantId,
            role: user.role,
          },
          JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );
        return res.json({ token });
      }

      res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Admin: signup
app.post(
  "/api/signup",
  authLimiter,
  [validateEmail, validatePassword, validateRestaurantName, validateFirstName, validateLastName],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { 
        restaurantName, 
        email, 
        password,
        restaurantType,
        address,
        phone,
        firstName,
        lastName 
      } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Generate unique slug for restaurant
      const baseSlug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') 
        .replace(/\s+/g, '-')
        .substring(0, 50);
        
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug is unique
      while (await prisma.restaurant.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create restaurant and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Restaurant
        const restaurant = await tx.restaurant.create({
          data: {
            name: restaurantName,
            slug,
            description: `Welcome to ${restaurantName}`,
            contact: phone || '',
            address: address || '',
            defaultLanguage: 'fi',
            supportedLanguages: JSON.stringify(['fi', 'en', 'sv']),
            currency: 'SEK',
            timezone: 'Europe/Helsinki',
          },
        });

        // 2. Create User linked to Restaurant
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName: firstName || '',
            lastName: lastName || '',
            role: 'OWNER',
            restaurantId: restaurant.id,
          },
        });

        return { restaurant, user };
      });

      if (isDev) {
        console.log(`✅ New restaurant signup: ${restaurantName} (${email})`);
        console.log(`🏪 Restaurant slug: ${result.restaurant.slug}`);
        console.log(`👤 User role: ${result.user.role}`);
      }

      res.status(201).json({
        message: "Account created successfully! You can now log in.",
        restaurant: {
          name: result.restaurant.name,
          slug: result.restaurant.slug,
        },
        user: {
          email: result.user.email,
          role: result.user.role,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  }
);

// Admin: Get user profile
app.get("/api/admin/profile", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        email: true,
        restaurant: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      email: user.email,
      restaurantName: user.restaurant?.name,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Admin: Update user profile
app.put("/api/admin/profile", requireAuth, async (req, res) => {
  try {
    const { email, restaurantName } = req.body;

    console.log("Updating user profile:", { email, restaurantName });

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(email && { email }),
      },
    });

    // Update restaurant name if provided
    if (restaurantName && req.user.restaurantId) {
      await prisma.restaurant.update({
        where: { id: req.user.restaurantId },
        data: { name: restaurantName },
      });
    }

    console.log("Profile updated successfully");
    res.json({
      email: updatedUser.email,
      restaurantName: restaurantName,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Admin: Change password
app.put("/api/admin/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log("Password change request for user:", req.user.userId);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    console.log("Password changed successfully");
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Forgot password - send reset token
app.post("/api/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { restaurant: true }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: "If an account with that email exists, we've sent password reset instructions." 
      });
    }

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    // Set token expiry (1 hour from now)
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Store reset token (you'd need to add these fields to user table in production)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // In production, add resetToken and resetTokenExpiry fields to User model
        // For now, we'll use a simple in-memory approach
      }
    });

    // In production, send email here
    console.log(`Password reset requested for ${email}`);
    console.log(`Reset token: ${resetToken} (expires: ${tokenExpiry})`);
    console.log(`Reset URL: ${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`);

    // For development, return the token (remove in production!)
    if (isDev) {
      return res.json({ 
        message: "Password reset instructions sent",
        token: resetToken // Only for development!
      });
    }

    res.json({ 
      message: "If an account with that email exists, we've sent password reset instructions." 
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// Reset password with token
app.post("/api/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // In production, verify token from database
    // For now, we'll accept any token for development
    if (!isDev && !token) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // For development, find user by email pattern or use hardcoded logic
    // In production, you'd look up user by reset token
    const users = await prisma.user.findMany({
      take: 1 // Just get first user for demo
    });

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = users[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // In production, also clear resetToken and resetTokenExpiry
      }
    });

    console.log(`Password reset successful for user ${user.id}`);

    res.json({ message: "Password reset successful. You can now log in with your new password." });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Middleware to protect admin routes
function requireAuth(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Store user data in request
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Admin: list all dishes
app.get("/api/admin/menu", requireAuth, async (req, res) => {
  try {
    const language = req.query.lang || req.query.language || "en"; // Get language parameter

    let dishes;
    try {
      // Try to fetch with ingredients
      dishes = await prisma.dish.findMany({
        where: {
          restaurantId: req.user.restaurantId, // Only dishes for this restaurant
        },
        include: {
          category: true,
          dishIngredients: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { displayOrder: "asc" },
      });

      // Filter out any dishIngredients with null ingredients after fetch
      dishes = dishes.map(dish => ({
        ...dish,
        dishIngredients: dish.dishIngredients?.filter(di => di.ingredient) || []
      }));

    } catch (includeError) {
      console.error("Error fetching dishes with ingredients, falling back to basic fetch:", includeError);
      
      // Clean up orphaned dish_ingredients relationships first
      try {
        await prisma.$executeRaw`
          DELETE FROM dish_ingredients 
          WHERE ingredient_id NOT IN (SELECT _id FROM ingredients)
        `;
        console.log("Cleaned up orphaned dish_ingredients relationships");
      } catch (cleanupError) {
        console.error("Error cleaning up orphaned relationships:", cleanupError);
      }

      // Fallback to basic fetch without ingredients
      dishes = await prisma.dish.findMany({
        where: {
          restaurantId: req.user.restaurantId,
        },
        include: {
          category: true,
        },
        orderBy: { displayOrder: "asc" },
      });

      console.log("Admin menu fallback: Found", dishes.length, "dishes, now fetching ingredients manually");

      // Manually fetch ingredients for each dish
      for (let dish of dishes) {
        try {
          const dishIngredients = await prisma.dishIngredient.findMany({
            where: { dishId: dish.id },
            include: { ingredient: true }
          });
          
          // Filter out null ingredients and attach to dish
          dish.dishIngredients = dishIngredients.filter(di => di.ingredient);
          console.log(`Admin menu fallback: Dish ${dish.name} has ${dish.dishIngredients.length} ingredients`);
        } catch (ingredientError) {
          console.error(`Admin menu fallback: Error fetching ingredients for dish ${dish.name}:`, ingredientError);
          dish.dishIngredients = [];
        }
      }
    }

    const formattedDishes = dishes.map((dish) => {
      try {
        // Translate the dish based on language parameter
        const translatedDish = translateDish(dish, language);

        const allergenTags = safeParseArray(dish.allergenTags);
        const components = safeParseArray(dish.components);
        const ingredients = dish.dishIngredients 
          ? dish.dishIngredients
              .filter(di => di.ingredient && di.ingredient.name) // Filter out null ingredients
              .map(di => di.ingredient.name)
          : [];

        return {
          id: dish.id,
          name: translatedDish.name,
          description: translatedDish.description,
          price: dish.price,
          category: dish.category,
          ingredients: Array.isArray(ingredients) ? ingredients : [],
          allergen_tags: Array.isArray(allergenTags) ? allergenTags : [],
          modification_note: translatedDish.modificationNote,
          is_modifiable: dish.isModifiable,
          is_active: dish.isActive !== undefined ? dish.isActive : true,
          components: Array.isArray(components) ? components : [],
          created_at: dish.createdAt,
          updated_at: dish.updatedAt,
          // Include original translations for admin editing
          translations: dish.translations,
        };
      } catch (error) {
        console.error(`Error formatting admin dish ${dish.name}:`, error);
        return {
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          category: dish.category,
          ingredients: [],
          allergen_tags: [],
          modification_note: dish.modificationNote,
          is_modifiable: dish.isModifiable,
          is_active: dish.isActive !== undefined ? dish.isActive : true,
          components: [],
          created_at: dish.createdAt,
          updated_at: dish.updatedAt,
        };
      }
    });

    res.json(formattedDishes);
  } catch (error) {
    console.error("Error fetching admin menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Admin: create new dish
app.post(
  "/api/admin/menu",
  requireAuth,
  validateDishInput,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        category,
        ingredients,
        allergen_tags,
        modification_note,
        is_modifiable,
        is_active,
        components,
      } = req.body;

      if (!Array.isArray(allergen_tags)) {
        return res
          .status(400)
          .json({ error: "allergen_tags must be an array" });
      }

      console.log("🔍 Creating dish with user:", req.user);
      console.log("🔍 Request body:", req.body);

      const newDish = await prisma.dish.create({
        data: {
          name,
          description: description || "",
          price:
            typeof price === "string" ? parseFloat(price) || 0 : price || 0,
          category: category || "", // Add category field
          allergenTags: JSON.stringify(allergen_tags),
          modificationNote: modification_note || null,
          isModifiable: is_modifiable || false,
          isActive: is_active !== undefined ? is_active : true,

          // Set restaurant from authenticated user
          restaurantId: req.user.restaurantId,
        },
      });

      // Handle ingredients if provided
      let ingredientsList = [];
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        console.log("POST /api/admin/menu - Processing ingredients:", ingredients);
        
        // Find ingredients by name (global ingredients)
        const foundIngredients = await prisma.ingredient.findMany({
          where: {
            name: { in: ingredients },
            isActive: true
          }
        });

        console.log("POST /api/admin/menu - Found ingredients:", foundIngredients.map(i => i.name));

        // Create ingredient relationships
        if (foundIngredients.length > 0) {
          const dishIngredientData = foundIngredients.map(ingredient => ({
            dishId: newDish.id,
            ingredientId: ingredient.id,
            isOptional: false,
            isCore: true
          }));

          await prisma.dishIngredient.createMany({
            data: dishIngredientData
          });
          
          ingredientsList = foundIngredients.map(ing => ing.name);
          console.log("POST /api/admin/menu - Created ingredient relationships:", dishIngredientData.length);
        }
      }

      res.status(201).json({
        id: newDish.id,
        restaurantId: newDish.restaurantId,
        name: newDish.name,
        description: newDish.description,
        price: newDish.price,
        category: category || "", // Use original request data
        ingredients: ingredientsList, // Use actual stored ingredients
        allergen_tags: allergen_tags,
        modification_note: newDish.modificationNote,
        is_modifiable: newDish.isModifiable,
        is_active: newDish.isActive,
        components: components || [], // Use original request data
        created_at: newDish.createdAt,
        updated_at: newDish.updatedAt,
      });
    } catch (error) {
      console.error("Error creating dish:", error);
      console.error("Request body:", req.body);
      res.status(500).json({
        error: "Failed to create dish",
        details: error.message, // Always show details for debugging
        stack: isDev ? error.stack : undefined,
      });
    }
  }
);

// Admin: update existing dish
app.put("/api/admin/menu/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.userId || req.user.id; // Handle both userId and id fields

    console.log("PUT /api/admin/menu/:id - Update dish request:", {
      dishId: id,
      userId,
      updateData: JSON.stringify(updateData, null, 2),
    });

    // Check if this is a local dish ID (from frontend fallback)
    if (id.startsWith("local-")) {
      return res.status(400).json({
        error: "Cannot update local dishes",
        message: "This dish was created locally. Please refresh the page and recreate it.",
        dishId: id,
      });
    }

    // Validate MongoDB ObjectID format
    if (!id.match(/^[0-9a-f]{24}$/i)) {
      return res.status(400).json({
        error: "Invalid dish ID format",
        message: "Dish ID must be a valid MongoDB ObjectID",
        dishId: id,
      });
    }

    console.log("PUT /api/admin/menu/:id - req.user:", req.user);
    console.log("PUT /api/admin/menu/:id - userId extracted:", userId);

    console.log("PUT /api/admin/menu/:id - Detailed field analysis:");
    console.log("- ingredients field:", updateData.ingredients);
    console.log("- ingredients type:", typeof updateData.ingredients);
    console.log("- ingredients isArray:", Array.isArray(updateData.ingredients));
    console.log("- allergen_tags field:", updateData.allergen_tags);
    console.log("- allergen_tags type:", typeof updateData.allergen_tags);

    // Check if user owns this dish through restaurant association
    // TEMPORARY: Handle undefined userId (auth issue)
    let existingDish = null;
    if (userId) {
      existingDish = await prisma.dish.findFirst({
        where: {
          id,
          restaurant: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      if (!existingDish) {
        console.log("PUT /api/admin/menu/:id - Dish not found or unauthorized:", {
          dishId: id,
          userId,
        });
        return res.status(404).json({ error: "Dish not found or unauthorized" });
      }
    } else {
      console.log("PUT /api/admin/menu/:id - WARNING: Skipping auth check due to undefined userId");
      // Just check if dish exists
      existingDish = await prisma.dish.findFirst({
        where: { id }
      });
      
      if (!existingDish) {
        return res.status(404).json({ error: "Dish not found" });
      }
    }

    console.log("PUT /api/admin/menu/:id - Existing dish found, proceeding with update");

    // Transform data for Prisma - only include fields that exist in schema
    const prismaData = {};

    if (updateData.name !== undefined) prismaData.name = updateData.name;
    if (updateData.description !== undefined)
      prismaData.description = updateData.description;
    if (updateData.price !== undefined) prismaData.price = updateData.price;
    if (updateData.category !== undefined) prismaData.category = updateData.category;
    if (updateData.allergen_tags !== undefined)
      prismaData.allergenTags = JSON.stringify(updateData.allergen_tags || []);
    if (updateData.modification_note !== undefined)
      prismaData.modificationNote = updateData.modification_note;
    if (updateData.is_modifiable !== undefined)
      prismaData.isModifiable = updateData.is_modifiable;
    if (updateData.is_active !== undefined)
      prismaData.isActive = updateData.is_active;
    if (updateData.is_featured !== undefined)
      prismaData.isFeatured = updateData.is_featured;
    if (updateData.display_order !== undefined)
      prismaData.displayOrder = updateData.display_order;
    if (updateData.image_url !== undefined)
      prismaData.imageUrl = updateData.image_url;

    console.log(
      "PUT /api/admin/menu/:id - Prisma update data:",
      JSON.stringify(prismaData, null, 2)
    );

    // Handle ingredients relationship if provided
    let shouldUpdateIngredients = false;
    let ingredientNames = [];
    
    if (updateData.ingredients !== undefined) {
      shouldUpdateIngredients = true;
      ingredientNames = Array.isArray(updateData.ingredients) ? updateData.ingredients : [];
      console.log("PUT /api/admin/menu/:id - Processing ingredients:", ingredientNames);
    }

    const updatedDish = await prisma.dish.update({
      where: { id },
      data: prismaData,
    });

    // Update ingredient relationships if provided
    if (shouldUpdateIngredients) {
      console.log("PUT /api/admin/menu/:id - Updating ingredient relationships");
      
      // Remove existing ingredient relationships
      await prisma.dishIngredient.deleteMany({
        where: { dishId: id }
      });

      // Add new ingredient relationships
      if (ingredientNames.length > 0) {
        // Find ingredients by name (global ingredients)
        console.log("PUT /api/admin/menu/:id - Searching for ingredients with names:", ingredientNames);
        
        const ingredients = await prisma.ingredient.findMany({
          where: {
            name: { in: ingredientNames }
            // isActive: true  // Temporarily disabled to test
          }
        });

        console.log("PUT /api/admin/menu/:id - Found ingredients:", ingredients.map(i => ({ name: i.name, id: i.id, isActive: i.isActive })));
        
        // Also search without isActive filter to see if that's the issue
        const allIngredientsWithSameName = await prisma.ingredient.findMany({
          where: {
            name: { in: ingredientNames }
          }
        });
        
        console.log("PUT /api/admin/menu/:id - All ingredients with matching names (ignoring isActive):", allIngredientsWithSameName.map(i => ({ 
          name: i.name, 
          id: i.id, 
          isActive: i.isActive,
          isActiveType: typeof i.isActive,
          isActiveValue: i.isActive === true,
          isActiveString: String(i.isActive)
        })));

        // Create new relationships
        const dishIngredientData = ingredients.map(ingredient => ({
          dishId: id,
          ingredientId: ingredient.id,
          isOptional: false,
          isCore: true
        }));

        if (dishIngredientData.length > 0) {
          console.log("PUT /api/admin/menu/:id - About to create dish-ingredient relationships:", dishIngredientData);
          await prisma.dishIngredient.createMany({
            data: dishIngredientData
          });
          console.log("PUT /api/admin/menu/:id - Successfully created ingredient relationships:", dishIngredientData.length);
        } else {
          console.log("PUT /api/admin/menu/:id - No valid ingredients found, no relationships created");
        }
      }
    }

    console.log(
      "PUT /api/admin/menu/:id - Dish updated successfully:",
      updatedDish.id
    );

    // Fetch updated dish with ingredients for response
    const dishWithIngredients = await prisma.dish.findUnique({
      where: { id },
      include: {
        dishIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    const ingredientsList = dishWithIngredients?.dishIngredients
      ?.filter(di => di.ingredient && di.ingredient.name) // Filter out null ingredients  
      ?.map(di => di.ingredient.name) || [];

    res.json({
      id: updatedDish.id,
      name: updatedDish.name,
      description: updatedDish.description,
      price: updatedDish.price,
      category: updatedDish.category,
      ingredients: ingredientsList,
      allergen_tags: JSON.parse(updatedDish.allergenTags || "[]"),
      modification_note: updatedDish.modificationNote,
      is_modifiable: updatedDish.isModifiable,
      is_active: updatedDish.isActive,
      is_featured: updatedDish.isFeatured,
      display_order: updatedDish.displayOrder,
      image_url: updatedDish.imageUrl,
      components: [], // Legacy compatibility
      created_at: updatedDish.createdAt,
      updated_at: updatedDish.updatedAt,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to update dish", details: error.message });
  }
});

// Admin: delete dish
app.delete("/api/admin/menu/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this is a local dish ID (from frontend fallback)
    if (id.startsWith("local-")) {
      return res.status(400).json({
        error: "Cannot delete local dishes",
        message: "This dish was created locally. Please refresh the page.",
        dishId: id,
      });
    }

    // Validate MongoDB ObjectID format
    if (!id.match(/^[0-9a-f]{24}$/i)) {
      return res.status(400).json({
        error: "Invalid dish ID format",
        message: "Dish ID must be a valid MongoDB ObjectID",
        dishId: id,
      });
    }

    await prisma.dish.delete({
      where: { id },
    });

    res.json({ message: "Dish deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Dish not found" });
    }
    console.error("Error deleting dish:", error);
    res.status(500).json({ error: "Failed to delete dish" });
  }
});

// GET /api/admin/ingredients - Get all ingredients
app.get("/api/admin/ingredients", requireAuth, async (req, res) => {
  try {
    console.log("🔍 Fetching ingredients from database...");
    const language = req.query.lang || req.query.language || "en"; // Get language parameter
    console.log("🔍 Requested language:", language);

    let ingredients;
    try {
      console.log("🎯 Querying Ingredient collection from MongoDB...");
      ingredients = await prisma.ingredient.findMany({
        include: {
          category: true,
        },
        orderBy: [{ name: "asc" }],
      });
      console.log(`🔍 Found ${ingredients.length} ingredients in database`);

      if (ingredients.length === 0) {
        console.log("❌ No ingredients found in database");
        return res.status(404).json({ error: "No ingredients found in database" });
      }
    } catch (dbError) {
      console.error("💥 Database error:", dbError.message);
      return res.status(500).json({ error: "Database connection failed", details: dbError.message });
    }

    // Transform to match frontend expectations with translation support
    const transformedIngredients = ingredients.map((ingredient) => {
      const translatedIngredient = translateIngredient(ingredient, language);

      console.log(
        `🔍 Ingredient ${ingredient.name} -> ${
          translatedIngredient.name
        } (lang: ${language}, hasTranslations: ${!!ingredient.translations})`
      );

      return {
        id: ingredient.id,
        name: translatedIngredient.name,
        description: translatedIngredient.description,
        category: ingredient.category?.name?.toLowerCase() || "other",
        allergen_tags: translatedIngredient.allergen_tags, // Use already parsed data from translateIngredient
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
        // Include original translations for admin editing
        translations: ingredient.translations,
      };
    });

    console.log(`🔍 Returning ${transformedIngredients.length} transformed ingredients`);
    res.json(transformedIngredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch ingredients", details: error.message });
  }
});

// POST /api/admin/ingredients - Create new ingredient
app.post("/api/admin/ingredients", requireAuth, async (req, res) => {
  try {
    const { name, category, parentId, allergen_tags } = req.body;

    if (isDev) console.log('Creating ingredient:', { name, category, allergen_tags });

    // For now, skip category lookup due to schema constraints
    // Categories require restaurantId but we want global ingredients
    let categoryId = null;
    // if (category) {
    //   const categoryRecord = await prisma.category.findFirst({
    //     where: { 
    //       name: { contains: category, mode: "insensitive" }
    //     },
    //   });
    //   categoryId = categoryRecord?.id;
    // }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        categoryId,
        allergenTags: JSON.stringify(allergen_tags || []),
        // No restaurantId - ingredients are global
      },
      include: {
        category: true,
      },
    });

    // Transform response
    const transformedIngredient = {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category?.name?.toLowerCase() || "other",
      allergen_tags: JSON.parse(ingredient.allergenTags || "[]"),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    };

    res.status(201).json(transformedIngredient);
  } catch (error) {
    console.error("Error creating ingredient:", {
      error: error.message,
      code: error.code,
      meta: error.meta,
      restaurantId: req.user.restaurantId,
      requestBody: req.body
    });
    res.status(500).json({ error: "Failed to create ingredient", details: isDev ? error.message : undefined });
  }
});

// PUT /api/admin/ingredients/:id - Update ingredient
app.put("/api/admin/ingredients/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, parentId, allergen_tags } = req.body;

    if (isDev)
      console.log("Updating ingredient:", {
        id,
        name,
        category,
        allergen_tags,
      });

    // For now, skip category lookup due to schema constraints
    // Categories require restaurantId but we want global ingredients
    let categoryId = null;
    // if (category) {
    //   const categoryRecord = await prisma.category.findFirst({
    //     where: {
    //       name: { contains: category, mode: "insensitive" },
    //     },
    //   });
    //   categoryId = categoryRecord?.id;
    // }

    const ingredient = await prisma.ingredient.update({
      where: {
        id, // No restaurantId constraint - ingredients are global
      },
      data: {
        name,
        categoryId,
        allergenTags: JSON.stringify(allergen_tags || []),
      },
      include: {
        category: true,
      },
    });

    // Transform response
    const transformedIngredient = {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category?.name?.toLowerCase() || "other",
      allergen_tags: JSON.parse(ingredient.allergenTags || "[]"),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    };

    res.json(transformedIngredient);
  } catch (error) {
    console.error("Error updating ingredient:", {
      error: error.message,
      code: error.code,
      meta: error.meta,
      ingredientId: req.params.id,
      restaurantId: req.user.restaurantId,
      requestBody: req.body,
    });
    res.status(500).json({
      error: "Failed to update ingredient",
      details: isDev ? error.message : undefined,
    });
  }
});

// DELETE /api/admin/ingredients/:id - Delete ingredient
app.delete("/api/admin/ingredients/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ingredient.delete({
      where: { 
        id, // No restaurantId constraint - ingredients are global
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting ingredient:", {
      error: error.message,
      code: error.code,
      ingredientId: id,
    });
    res.status(500).json({ error: "Failed to delete ingredient", details: isDev ? error.message : undefined });
  }
});

// GET /api/admin/categories - Get all categories
app.get("/api/admin/categories", requireAuth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        restaurantId: req.user.restaurantId, // Only categories for this restaurant
      },
      include: {
        _count: {
          select: { ingredients: true },
        },
        ingredients: {
          select: {
            id: true,
            name: true,
            allergenTags: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to include ingredient count and details
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      ingredientCount: category._count.ingredients,
      ingredients: category.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        allergen_tags: JSON.parse(ing.allergenTags || "[]"),
      })),
    }));

    res.json(transformedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/admin/categories - Create new category
app.post("/api/admin/categories", requireAuth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description: description || "",
        color: color || "#3B82F6",
        icon: icon || "🥄",
        restaurantId: req.user.restaurantId, // Associate with restaurant
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/admin/categories/:id - Update category
app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    // First verify the category belongs to the user's restaurant
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: req.user.restaurantId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        color,
        icon,
      },
    });

    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// ============== RESTAURANT SLUG ROUTING ENDPOINTS ==============

// GET /api/restaurants - Get all active restaurants for public listing
app.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET /api/restaurants/slug/:slug - Get restaurant by slug for new URL structure
app.get("/api/restaurants/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        dishes: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Transform for frontend compatibility
    const transformedRestaurant = {
      ...restaurant,
      default_language: restaurant.defaultLanguage,
      supported_languages: JSON.parse(restaurant.supportedLanguages || "[]"),
      show_prices: restaurant.showPrices,
      subscription_tier: restaurant.subscriptionTier,
      is_active: restaurant.isActive,
      created_at: restaurant.createdAt,
      updated_at: restaurant.updatedAt,
    };

    res.json(transformedRestaurant);
  } catch (error) {
    console.error("Error fetching restaurant by slug:", error);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

// GET /api/restaurants/:id - Get restaurant by ID (for login redirect)
app.get("/api/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        dishes: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Transform for frontend compatibility
    const transformedRestaurant = {
      ...restaurant,
      default_language: restaurant.defaultLanguage,
      supported_languages: JSON.parse(restaurant.supportedLanguages || "[]"),
      show_prices: restaurant.showPrices,
      subscription_tier: restaurant.subscriptionTier,
      is_active: restaurant.isActive,
      created_at: restaurant.createdAt,
      updated_at: restaurant.updatedAt,
    };

    res.json(transformedRestaurant);
  } catch (error) {
    console.error("Error fetching restaurant by ID:", error);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

// GET /api/restaurants/my-restaurants - Get restaurants for current user (for restaurant switcher)
app.get("/api/restaurants/my-restaurants", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // Get restaurants based on user role
    let restaurants = [];

    if (user.role === "SUPERADMIN") {
      // Superadmin can see all restaurants
      restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });
    } else {
      // Regular users only see their restaurant
      restaurants = await prisma.restaurant.findMany({
        where: {
          id: user.restaurantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          isActive: true,
        },
      });
    }

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching user restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// Alias for /api/my-restaurants
app.get("/api/my-restaurants", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // Just return the user's restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        isActive: true,
      },
    });

    res.json([restaurant]); // Return as array for frontend compatibility
  } catch (error) {
    console.error("Error fetching my restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET /api/menu/by-slug/:slug - Get menu by restaurant slug (for new URL structure)
app.get("/api/menu/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const language = req.query.lang || req.query.language || "en"; // Get language parameter

    // First find the restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Get dishes for this restaurant
    const dishes = await prisma.dish.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    // Transform dishes for frontend compatibility with translation support
    const transformedDishes = dishes.map((dish) => {
      // Translate the dish based on language parameter
      const translatedDish = translateDish(dish, language);

      return {
        ...dish,
        name: translatedDish.name,
        description: translatedDish.description,
        modificationNote: translatedDish.modificationNote,
        allergen_tags: JSON.parse(dish.allergenTags || "[]"),
        modification_note: translatedDish.modificationNote,
        is_modifiable: dish.isModifiable,
        is_active: dish.isActive,
        is_featured: dish.isFeatured,
        display_order: dish.displayOrder,
        image_url: dish.imageUrl,
        restaurant_id: dish.restaurantId,
        category_id: dish.categoryId,
        created_at: dish.createdAt,
        updated_at: dish.updatedAt,
      };
    });

    res.json(transformedDishes);
  } catch (error) {
    console.error("Error fetching menu by slug:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// DELETE /api/admin/categories/:id - Delete category
app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // First verify the category belongs to the user's restaurant
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: req.user.restaurantId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has any ingredients
    const ingredientsCount = await prisma.ingredient.count({
      where: {
        categoryId: id,
        restaurantId: req.user.restaurantId,
      },
    });

    if (ingredientsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category. It has ${ingredientsCount} ingredient(s) assigned to it. Please reassign or delete the ingredients first.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Emergency admin creation endpoint (for dev purposes)
app.post("/api/emergency/create-admin", async (req, res) => {
  try {
    console.log("Emergency admin creation requested");
    
    // Only allow in development or if specific env var is set
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_EMERGENCY_ADMIN) {
      return res.status(403).json({ error: "Emergency admin creation not allowed in production" });
    }

    // Check if demo restaurant exists
    let demoRestaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-restaurant' }
    });

    if (!demoRestaurant) {
      // Create demo restaurant
      demoRestaurant = await prisma.restaurant.create({
        data: {
          name: 'Demo Restaurant',
          slug: 'demo-restaurant',
          address: 'Demo Address',
          showPrices: true,
          currency: 'SEK',
          timezone: 'Europe/Helsinki',
          defaultLanguage: 'en',
          supportedLanguages: JSON.stringify(['en', 'fi']),
          isActive: true,
          subscriptionTier: 'premium'
        }
      });
      console.log('✅ Demo restaurant created');
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Delete existing admin if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@menushield.com' }
    });
    
    if (existingAdmin) {
      await prisma.user.delete({
        where: { email: 'admin@menushield.com' }
      });
      console.log('🗑️ Deleted existing admin');
    }
    
    // Create new admin user
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@menushield.com',
        passwordHash,
        role: 'OWNER',
        restaurantId: demoRestaurant.id
      }
    });
    
    console.log('✅ Emergency admin created successfully');
    
    res.json({
      message: 'Emergency admin created successfully',
      credentials: {
        email: 'admin@menushield.com',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating emergency admin:', error);
    res.status(500).json({ error: 'Failed to create emergency admin' });
  }
});

// Start server with proper error handling
async function startServer() {
  try {
    console.log("Starting server...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Port:", PORT);
    console.log("Database URL configured:", !!process.env.DATABASE_URL);

    // Test database connection
    await testConnection();
    console.log("Database connection successful");

    // Start server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log("✅ Database connected and ready");
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

startServer();

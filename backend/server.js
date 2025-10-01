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

// Load environment variables
dotenv.config();

// Only log in development
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  console.log('🔧 Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
}

const prisma = new PrismaClient();
const app = express();

// Helper to safely parse allergenTags as array
function safeParseArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [val];
    }
  }
  if (val && typeof val === 'object' && 'length' in val) {
    return Array.from(val);
  }
  if (val && typeof val === 'object') {
    return Object.values(val).filter(v => typeof v === 'string');
  }
  return [];
}

// Validate JWT_SECRET in production
if (!isDev && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_strong_secret")) {
  console.error('⚠️ CRITICAL: Set a strong JWT_SECRET in production!');
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
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://menushield.netlify.app', 'https://menushield-production.up.railway.app']
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (isDev) console.log('Health check requested');
    // Test database connection with MongoDB
    await prisma.$connect();
    if (isDev) console.log('Database connection OK');
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      env: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Simple test endpoint that doesn't need database
app.get('/ping', (req, res) => {
  if (isDev) console.log('Ping received');
  res.status(200).json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Manual seed endpoint for testing
app.post('/api/seed', async (req, res) => {
  try {
    if (isDev) console.log('Manual seed requested');
    
    // Check if categories exist
    const existingCategories = await prisma.category.count();
    if (existingCategories === 0) {
      // Create categories
      const categories = [
        { name: 'Appetizers', description: 'Start your meal with these delicious appetizers', color: '#ff6b6b' },
        { name: 'Salads', description: 'Fresh and healthy salad options', color: '#4ecdc4' },
        { name: 'Main Course', description: 'Hearty main dishes', color: '#45b7d1' },
        { name: 'Pizza', description: 'Wood-fired pizzas', color: '#feca57' },
        { name: 'Bowls', description: 'Healthy bowl options', color: '#ff9ff3' },
        { name: 'Desserts', description: 'Sweet treats to end your meal', color: '#54a0ff' },
        { name: 'Beverages', description: 'Drinks and refreshments', color: '#5f27cd' }
      ];

      for (const category of categories) {
        await prisma.category.create({ data: category });
      }
      if (isDev) console.log(`✅ Created ${categories.length} categories`);
    }

    // Check if ingredients exist
    const existingIngredients = await prisma.ingredient.count();
    if (existingIngredients === 0) {
      // Create ingredients
      const ingredients = [
        { name: 'Chicken Breast', allergenTags: JSON.stringify([]) },
        { name: 'Salmon', allergenTags: JSON.stringify(['fish']) },
        { name: 'Mozzarella', allergenTags: JSON.stringify(['dairy']) },
        { name: 'Spinach', allergenTags: JSON.stringify([]) },
        { name: 'Tomatoes', allergenTags: JSON.stringify([]) },
        { name: 'Quinoa', allergenTags: JSON.stringify([]) },
        { name: 'Avocado', allergenTags: JSON.stringify([]) },
        { name: 'Eggs', allergenTags: JSON.stringify(['eggs']) },
        { name: 'Wheat Flour', allergenTags: JSON.stringify(['gluten']) },
        { name: 'Basil', allergenTags: JSON.stringify([]) }
      ];

      for (const ingredient of ingredients) {
        await prisma.ingredient.create({ data: ingredient });
      }
      if (isDev) console.log(`✅ Created ${ingredients.length} ingredients`);
    }

    // Check if admin user exists
    const existingUsers = await prisma.user.count();
    if (existingUsers === 0) {
      // Create admin user
      const adminUser = {
        email: process.env.ADMIN_EMAIL || 'admin@menushield.com',
        passwordHash: process.env.ADMIN_PASSWORD || 'admin123',
        restaurantName: 'MenuShield Demo Restaurant'
      };

      await prisma.user.create({ data: adminUser });
      if (isDev) console.log('✅ Created admin user');
    }

    // Check if more dishes are needed
    const existingDishes = await prisma.dish.count();
    if (existingDishes < 5) {
      // Create additional sample dishes
      const sampleDishes = [
        {
          name: 'Margherita Pizza',
          description: 'Classic tomato sauce, mozzarella, fresh basil',
          price: 12.90,
          category: 'Pizza',
          allergenTags: JSON.stringify(['dairy', 'gluten']),
          isModifiable: true,
          modificationNote: 'Can be made vegan with dairy-free cheese'
        },
        {
          name: 'Caesar Salad',
          description: 'Romaine lettuce, parmesan, croutons, caesar dressing',
          price: 10.50,
          category: 'Salads',
          allergenTags: JSON.stringify(['dairy', 'eggs', 'gluten']),
          isModifiable: true,
          modificationNote: 'Can be made without croutons for gluten-free'
        },
        {
          name: 'Chicken Teriyaki Bowl',
          description: 'Grilled chicken with teriyaki sauce, rice, and vegetables',
          price: 15.90,
          category: 'Bowls',
          allergenTags: JSON.stringify(['soy']),
          isModifiable: true,
          modificationNote: 'Can substitute chicken with tofu'
        }
      ];

      for (const dish of sampleDishes) {
        // Check if dish already exists
        const existing = await prisma.dish.findFirst({
          where: { name: dish.name }
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
      users: await prisma.user.count()
    };

    res.json({ 
      message: 'Database seeded successfully', 
      stats,
      seeded: true
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://menushield.netlify.app', 'https://menushield-production.netlify.app'] // Päivitetään Netlify URL:llä
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
    const restaurantId = req.query.rid || req.query.r;

    const dishes = await prisma.dish.findMany({});

    // Transform for guest view with EXTRA safety
    const guestMenu = dishes.map((dish) => {
      let allergenTags;
      try {
        allergenTags = safeParseArray(dish.allergenTags);
        // Extra check - force array
        if (!Array.isArray(allergenTags)) {
          allergenTags = [];
        }
      } catch (e) {
        console.error('Allergen parsing error for dish', dish.name, ':', e);
        allergenTags = [];
      }

      let components;
      try {
        components = safeParseArray(dish.components);
        if (!Array.isArray(components)) {
          components = [];
        }
      } catch (e) {
        console.error('Components parsing error for dish', dish.name, ':', e);
        components = [];
      }

      let ingredients;
      try {
        ingredients = safeParseArray(dish.ingredients);
        if (!Array.isArray(ingredients)) {
          ingredients = [];
        }
      } catch (e) {
        console.error('Ingredients parsing error for dish', dish.name, ':', e);
        ingredients = [];
      }

      return {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        ingredients: ingredients,
        allergen_tags: allergenTags,
        modification_note: dish.modificationNote,
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
      orderBy: { name: 'asc' }
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
    const ingredients = await prisma.ingredient.findMany({
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(ingredients);
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
      }
    );
  } catch (error) {
    console.error("Error fetching restaurant info:", error);
    res.status(500).json({ error: "Failed to fetch restaurant info" });
  }
});

// Input validation middleware
const validateEmail = body('email').isEmail().normalizeEmail();
const validatePassword = body('password').isLength({ min: 6 }).trim();
const validateRestaurantName = body('restaurantName').isLength({ min: 1, max: 100 }).trim();
const validateDishInput = [
  body('name').isLength({ min: 1, max: 200 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('price').optional().toFloat().isFloat({ min: 0 }),
  body('category').optional().isLength({ max: 100 }).trim(),
  body('allergenTags').optional().isArray(),
  body('components').optional().isArray(),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Admin: login
app.post("/api/login", authLimiter, [validateEmail, validatePassword], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check demo credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token });
    }

    // Check database users
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const token = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ token });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Admin: signup
app.post("/api/signup", authLimiter, [validateEmail, validatePassword, validateRestaurantName], handleValidationErrors, async (req, res) => {
  try {
    const { restaurantName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        restaurantName,
      },
    });

    if (isDev) console.log(`New restaurant signup: ${restaurantName} (${email})`);

    res.status(201).json({
      message: "Account created successfully",
      restaurantName,
      email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
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
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Admin: list all dishes
app.get("/api/admin/menu", requireAuth, async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    const formattedDishes = dishes.map((dish) => {
      try {
        const allergenTags = safeParseArray(dish.allergenTags);
        const components = safeParseArray(dish.components);
        
        return {
          ...dish,
          allergen_tags: Array.isArray(allergenTags) ? allergenTags : [],
          components: Array.isArray(components) ? components : [],
          ingredients: dish.ingredients.map((di) => di.ingredient.name),
        };
      } catch (error) {
        console.error(`Error formatting admin dish ${dish.name}:`, error);
        return {
          ...dish,
          allergen_tags: [],
          components: [],
          ingredients: dish.ingredients.map((di) => di.ingredient.name),
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
app.post("/api/admin/menu", requireAuth, validateDishInput, handleValidationErrors, async (req, res) => {
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
      components,
    } = req.body;

    if (!Array.isArray(allergen_tags)) {
      return res.status(400).json({ error: "allergen_tags must be an array" });
    }

    const newDish = await prisma.dish.create({
      data: {
        name,
        description: description || "",
        price: typeof price === 'string' ? parseFloat(price) || 0 : (price || 0),
        category: category || "",
        ingredients: JSON.stringify(ingredients || []),
        allergenTags: JSON.stringify(allergen_tags),
        modificationNote: modification_note || null,
        isModifiable: is_modifiable || false,
        components: JSON.stringify(components || []),
      },
    });

    // Handle ingredients if provided (for future use)
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      // For now, we'll just include ingredients in response without storing relationships
      // This maintains backward compatibility
    }

    res.status(201).json({
      id: newDish.id,
      name: newDish.name,
      description: newDish.description,
      price: newDish.price,
      category: newDish.category,
      ingredients: JSON.parse(newDish.ingredients || "[]"),
      allergen_tags: JSON.parse(newDish.allergenTags),
      modification_note: newDish.modificationNote,
      is_modifiable: newDish.isModifiable,
      components: JSON.parse(newDish.components || "[]"),
      created_at: newDish.createdAt,
      updated_at: newDish.updatedAt,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    console.error("Request body:", req.body);
    res.status(500).json({ 
      error: "Failed to create dish",
      details: isDev ? error.message : undefined
    });
  }
});

// Admin: update existing dish
app.put("/api/admin/menu/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Transform data for Prisma
    const prismaData = {
      name: updateData.name,
      description: updateData.description,
      price: updateData.price,
      category: updateData.category,
      ingredients: JSON.stringify(updateData.ingredients || []),
      allergenTags: JSON.stringify(updateData.allergen_tags || []),
      modificationNote: updateData.modification_note,
      isModifiable: updateData.is_modifiable,
      components: JSON.stringify(updateData.components || []),
    };

    const updatedDish = await prisma.dish.update({
      where: { id },
      data: prismaData,
    });

    if (!updatedDish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    res.json({
      id: updatedDish.id,
      name: updatedDish.name,
      description: updatedDish.description,
      price: updatedDish.price,
      category: updatedDish.category,
      ingredients: JSON.parse(updatedDish.ingredients || "[]"),
      allergen_tags: JSON.parse(updatedDish.allergenTags),
      modification_note: updatedDish.modificationNote,
      is_modifiable: updatedDish.isModifiable,
      components: JSON.parse(updatedDish.components || "[]"),
      created_at: updatedDish.createdAt,
      updated_at: updatedDish.updatedAt,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({ error: "Failed to update dish" });
  }
});

// Admin: delete dish
app.delete("/api/admin/menu/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

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
    const ingredients = await prisma.ingredient.findMany({
      include: {
        category: true,
        parent: true,
        children: true,
      },
      orderBy: [{ name: "asc" }],
    });

    // Transform to match frontend expectations
    const transformedIngredients = ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category?.name?.toLowerCase() || "other",
      parentId: ingredient.parentId,
      allergen_tags: JSON.parse(ingredient.allergenTags || "[]"),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    }));

    res.json(transformedIngredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// POST /api/admin/ingredients - Create new ingredient
app.post("/api/admin/ingredients", requireAuth, async (req, res) => {
  try {
    const { name, category, parentId, allergen_tags } = req.body;

    // Find category by name
    let categoryId = null;
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: { contains: category, mode: "insensitive" } },
      });
      categoryId = categoryRecord?.id;
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        categoryId,
        parentId: parentId || null,
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
      parentId: ingredient.parentId,
      allergen_tags: JSON.parse(ingredient.allergenTags || "[]"),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    };

    res.status(201).json(transformedIngredient);
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

// PUT /api/admin/ingredients/:id - Update ingredient
app.put("/api/admin/ingredients/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, parentId, allergen_tags } = req.body;

    // Find category by name
    let categoryId = null;
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: { contains: category, mode: "insensitive" } },
      });
      categoryId = categoryRecord?.id;
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        categoryId,
        parentId: parentId || null,
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
      parentId: ingredient.parentId,
      allergen_tags: JSON.parse(ingredient.allergenTags || "[]"),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    };

    res.json(transformedIngredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ error: "Failed to update ingredient" });
  }
});

// DELETE /api/admin/ingredients/:id - Delete ingredient
app.delete("/api/admin/ingredients/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ingredient.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

// GET /api/admin/categories - Get all categories
app.get("/api/admin/categories", requireAuth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
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

// DELETE /api/admin/categories/:id - Delete category
app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has any ingredients
    const ingredientsCount = await prisma.ingredient.count({
      where: { categoryId: id },
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

// Start server with proper error handling
async function startServer() {
  try {
    console.log('Starting server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', PORT);
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    
    // Test database connection
    await testConnection();
    console.log('Database connection successful');
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('✅ Database connected and ready');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        prisma.$disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

startServer();

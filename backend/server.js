import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
dotenv.config();

console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "replace_with_strong_secret";
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    console.log('Health check requested');
    // Test database connection with MongoDB
    await prisma.$connect();
    console.log('Database connection OK');
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
  console.log('Ping received');
  res.status(200).json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Manual seed endpoint for testing
app.post('/api/seed', async (req, res) => {
  try {
    console.log('Manual seed requested');
    
    // Check if data exists
    const existingDishes = await prisma.dish.count();
    if (existingDishes > 0) {
      return res.json({ message: `Database already has ${existingDishes} dishes`, seeded: false });
    }

    // Create sample dishes
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
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon herb butter',
        price: 18.90,
        category: 'Main Course',
        allergenTags: JSON.stringify(['fish']),
        isModifiable: false
      }
    ];

    for (const dish of sampleDishes) {
      await prisma.dish.create({ data: dish });
    }

    console.log(`✅ Created ${sampleDishes.length} sample dishes`);
    res.json({ 
      message: `Successfully seeded ${sampleDishes.length} dishes`, 
      seeded: true,
      dishes: sampleDishes.length
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
app.use(express.json());

// Database connection test
async function testConnection() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
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

    const dishes = await prisma.dish.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Transform for guest view
    const guestMenu = dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      allergen_tags: JSON.parse(dish.allergenTags || "[]"),
      modification_note: dish.modificationNote,
      is_modifiable: dish.isModifiable,
      components: JSON.parse(dish.components || "[]"),
      ingredients: dish.ingredients.map((di) => di.ingredient.name),
    }));

    res.json(guestMenu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
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

// Admin: login
app.post("/api/login", async (req, res) => {
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
app.post("/api/signup", async (req, res) => {
  try {
    const { restaurantName, email, password } = req.body;

    if (!restaurantName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

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

    console.log(`New restaurant signup: ${restaurantName} (${email})`);

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

    const formattedDishes = dishes.map((dish) => ({
      ...dish,
      allergen_tags: JSON.parse(dish.allergenTags || "[]"),
      components: JSON.parse(dish.components || "[]"),
      ingredients: dish.ingredients.map((di) => di.ingredient.name),
    }));

    res.json(formattedDishes);
  } catch (error) {
    console.error("Error fetching admin menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Admin: create new dish
app.post("/api/admin/menu", requireAuth, async (req, res) => {
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

    if (!name || !Array.isArray(ingredients) || !Array.isArray(allergen_tags)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newDish = await prisma.dish.create({
      data: {
        name,
        description: description || "",
        price: price || 0,
        category: category || "",
        allergenTags: JSON.stringify(allergen_tags),
        modificationNote: modification_note || null,
        isModifiable: is_modifiable || false,
        components: JSON.stringify(components || []),
      },
    });

    res.status(201).json({
      ...newDish,
      allergen_tags: JSON.parse(newDish.allergenTags),
      components: JSON.parse(newDish.components || "[]"),
      ingredients: ingredients,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    res.status(500).json({ error: "Failed to create dish" });
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
      ...updatedDish,
      allergen_tags: JSON.parse(updatedDish.allergenTags),
      components: JSON.parse(updatedDish.components || "[]"),
      ingredients: updateData.ingredients || [],
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

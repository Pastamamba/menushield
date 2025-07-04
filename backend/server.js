// server.js
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Hard-coded admin credentials:
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "supersecret";

const JWT_SECRET = process.env.JWT_SECRET || "replace_with_strong_secret";
const PORT = process.env.PORT || 4000;

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const menuPath = path.join(__dirname, "data", "menu.json");

// Helper functions
function readMenu() {
  try {
    return JSON.parse(readFileSync(menuPath, "utf-8"));
  } catch (error) {
    console.error("Error reading menu:", error);
    return [];
  }
}

function writeMenu(menu) {
  try {
    writeFileSync(menuPath, JSON.stringify(menu, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing menu:", error);
    return false;
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Short URL redirect handler - must be before API routes
app.get("/m/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;
  // Redirect to the full menu URL
  res.redirect(`/menu?rid=${restaurantId}`);
});

// Public: fetch menu (filtered for guest view)
app.get("/api/menu", (req, res) => {
  const restaurantId = req.query.rid || req.query.r;
  const menu = readMenu();

  // For guests, we don't expose ingredients - only allergen tags and safe/unsafe status
  const guestMenu = menu.map((dish) => ({
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: dish.category,
    allergen_tags: dish.allergen_tags,
    modification_note: dish.modification_note,
    is_modifiable: dish.is_modifiable,
    // Note: we don't include 'ingredients' for guest privacy
  }));
  res.json(guestMenu);
});

// Public: fetch restaurant info
app.get("/api/restaurant", (req, res) => {
  const restaurantId = req.query.rid || req.query.r;

  // Mock restaurant data - in real app this would come from database
  const restaurant = {
    name: "Demo Restaurant",
    description:
      "A family-friendly restaurant committed to safe dining for all",
    contact: "(555) 123-4567",
  };

  res.json(restaurant);
});

// Admin: login, no hashing
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

// Admin: signup (for demo purposes, just accepts any registration)
app.post("/api/signup", (req, res) => {
  const { restaurantName, email, password } = req.body;

  if (!restaurantName || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // For demo purposes, we'll just accept the signup and return success
  // In a real app, you'd save to database and hash the password
  console.log(`New restaurant signup: ${restaurantName} (${email})`);

  res.status(201).json({
    message: "Account created successfully",
    restaurantName,
    email,
  });
});

// Admin: signup (for demo purposes, just accepts any registration)
app.post("/api/signup", (req, res) => {
  const { restaurantName, email, password } = req.body;

  if (!restaurantName || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // For demo purposes, we'll just accept the signup and return success
  // In a real app, you'd save to database and hash the password
  console.log(`New restaurant signup: ${restaurantName} (${email})`);

  res.status(201).json({
    message: "Account created successfully",
    restaurantName,
    email,
  });
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

// Admin: list all dishes (with full details including ingredients)
app.get("/api/admin/menu", requireAuth, (_req, res) => {
  const menu = readMenu();
  res.json(menu);
});

// Admin: create new dish
app.post("/api/admin/menu", requireAuth, (req, res) => {
  const {
    name,
    description,
    price,
    category,
    ingredients,
    allergen_tags,
    modification_note,
    is_modifiable,
  } = req.body;

  if (
    !name ||
    !ingredients ||
    !Array.isArray(ingredients) ||
    !Array.isArray(allergen_tags)
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const menu = readMenu();
  const newDish = {
    id: generateId(),
    name,
    description: description || "",
    price: price || 0,
    category: category || "",
    ingredients,
    allergen_tags,
    modification_note: modification_note || null,
    is_modifiable: is_modifiable || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  menu.push(newDish);

  if (writeMenu(menu)) {
    res.status(201).json(newDish);
  } else {
    res.status(500).json({ error: "Failed to save dish" });
  }
});

// Admin: update existing dish
app.put("/api/admin/menu/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    category,
    ingredients,
    allergen_tags,
    modification_note,
    is_modifiable,
  } = req.body;

  const menu = readMenu();
  const dishIndex = menu.findIndex((dish) => dish.id === id);

  if (dishIndex === -1) {
    return res.status(404).json({ error: "Dish not found" });
  }

  // Update dish with provided fields
  const updatedDish = {
    ...menu[dishIndex],
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(category !== undefined && { category }),
    ...(ingredients !== undefined && { ingredients }),
    ...(allergen_tags !== undefined && { allergen_tags }),
    ...(modification_note !== undefined && { modification_note }),
    ...(is_modifiable !== undefined && { is_modifiable }),
    updated_at: new Date().toISOString(),
  };

  menu[dishIndex] = updatedDish;

  if (writeMenu(menu)) {
    res.json(updatedDish);
  } else {
    res.status(500).json({ error: "Failed to update dish" });
  }
});

// Admin: delete dish
app.delete("/api/admin/menu/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  const menu = readMenu();
  const dishIndex = menu.findIndex((dish) => dish.id === id);

  if (dishIndex === -1) {
    return res.status(404).json({ error: "Dish not found" });
  }

  menu.splice(dishIndex, 1);

  if (writeMenu(menu)) {
    res.json({ message: "Dish deleted successfully" });
  } else {
    res.status(500).json({ error: "Failed to delete dish" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

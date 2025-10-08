const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Multi-tenant Authentication and Authorization Middleware
 * 
 * These middleware functions handle user authentication and ensure
 * proper tenant isolation in the multi-restaurant MenuShield system.
 */

// Enhanced authentication middleware that includes restaurant context
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get full user information including restaurant relationship
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              subscriptionTier: true,
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      if (!user.restaurant.isActive) {
        return res.status(403).json({ error: 'Restaurant is not active' });
      }

      // Attach user and restaurant context to request
      req.user = user;
      req.restaurant = user.restaurant;
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Middleware to validate restaurant access from URL parameter
function requireRestaurantAccess(req, res, next) {
  try {
    const { restaurantSlug } = req.params;
    
    if (!restaurantSlug) {
      return res.status(400).json({ error: 'Restaurant slug is required' });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(restaurantSlug)) {
      return res.status(400).json({ error: 'Invalid restaurant slug format' });
    }

    // Check if user's restaurant matches the requested restaurant
    if (req.restaurant.slug !== restaurantSlug) {
      return res.status(403).json({ 
        error: 'Access denied to this restaurant',
        userRestaurant: req.restaurant.slug,
        requestedRestaurant: restaurantSlug
      });
    }

    next();
  } catch (error) {
    console.error('Restaurant access validation error:', error);
    res.status(500).json({ error: 'Restaurant access validation failed' });
  }
}

// Role-based access control middleware
function requireRole(allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role validation error:', error);
      res.status(500).json({ error: 'Permission validation failed' });
    }
  };
}

// Utility function to get restaurant by slug (for public endpoints)
async function getRestaurantBySlug(req, res, next) {
  try {
    const { restaurantSlug } = req.params;
    
    if (!restaurantSlug) {
      return res.status(400).json({ error: 'Restaurant slug is required' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        slug: restaurantSlug,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        contact: true,
        website: true,
        showPrices: true,
        currency: true,
        defaultLanguage: true,
        supportedLanguages: true,
        timezone: true,
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error('Restaurant lookup error:', error);
    res.status(500).json({ error: 'Restaurant lookup failed' });
  }
}

// Tenant isolation helper for database queries
function buildTenantQuery(restaurantId, additionalWhere = {}) {
  return {
    where: {
      restaurantId,
      ...additionalWhere,
    }
  };
}

// Enhanced tenant query with includes
function buildTenantQueryWithIncludes(restaurantId, additionalWhere = {}, includes = {}) {
  return {
    where: {
      restaurantId,
      ...additionalWhere,
    },
    include: includes,
  };
}

// Middleware to add request logging with tenant context
function logTenantRequest(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userEmail: req.user?.email,
      restaurantSlug: req.restaurant?.slug,
      userRole: req.user?.role,
      timestamp: new Date().toISOString(),
    };
    
    console.log('API Request:', JSON.stringify(logData));
  });
  
  next();
}

// Error handler for tenant-related errors
function handleTenantError(error, req, res, next) {
  if (error.name === 'TenantError') {
    const statusMap = {
      'TENANT_ACCESS_DENIED': 403,
      'RESTAURANT_NOT_FOUND': 404,
      'INVALID_SLUG': 400,
      'USER_NOT_IN_RESTAURANT': 403,
    };
    
    return res.status(statusMap[error.code] || 500).json({
      error: error.message,
      code: error.code,
    });
  }
  
  next(error);
}

// Utility to validate user can access specific restaurant data
async function validateUserRestaurantAccess(userId, restaurantId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { restaurantId: true, isActive: true }
  });
  
  return user && user.isActive && user.restaurantId === restaurantId;
}

// Subscription tier validation
function requireSubscriptionTier(minimumTier) {
  const tierLevels = { 'free': 0, 'premium': 1, 'enterprise': 2 };
  
  return (req, res, next) => {
    try {
      if (!req.restaurant) {
        return res.status(403).json({ error: 'Restaurant context required' });
      }

      const userTierLevel = tierLevels[req.restaurant.subscriptionTier] || 0;
      const requiredTierLevel = tierLevels[minimumTier] || 0;

      if (userTierLevel < requiredTierLevel) {
        return res.status(402).json({ 
          error: 'Subscription upgrade required',
          current: req.restaurant.subscriptionTier,
          required: minimumTier
        });
      }

      next();
    } catch (error) {
      console.error('Subscription validation error:', error);
      res.status(500).json({ error: 'Subscription validation failed' });
    }
  };
}

module.exports = {
  requireAuth,
  requireRestaurantAccess,
  requireRole,
  getRestaurantBySlug,
  buildTenantQuery,
  buildTenantQueryWithIncludes,
  logTenantRequest,
  handleTenantError,
  validateUserRestaurantAccess,
  requireSubscriptionTier,
};
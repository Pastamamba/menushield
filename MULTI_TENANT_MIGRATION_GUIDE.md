# Multi-Tenant Database Migration Guide

## ⚠️ CRITICAL: Pre-Migration Steps

### 1. **Backup Your Database**
```bash
# Create database backup before migration
mysqldump -u your_username -p menushield > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using Prisma
npx prisma db pull --schema=./prisma/backup-schema.prisma
```

### 2. **Stop All Services**
```bash
# Stop the application to prevent data corruption
pm2 stop all
# or kill the development server
```

## 🚀 Migration Process

### Step 1: Review New Schema
The new multi-tenant schema includes:
- ✅ **User-Restaurant relationships** with proper foreign keys
- ✅ **Restaurant slug** for SEO-friendly URLs (`/menu/:slug`)
- ✅ **User roles** (OWNER, ADMIN, STAFF, VIEWER)
- ✅ **Tenant isolation** - all data scoped to restaurants
- ✅ **Restaurant invitations** system for adding users

### Step 2: Install Dependencies
```bash
cd backend
npm install @paralleldrive/cuid2  # For generating restaurant IDs
```

### Step 3: Preview Migration Changes
```bash
# Copy new schema over current one (after backup!)
cp prisma/schema-multitenant.prisma prisma/schema.prisma

# Generate migration without applying
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-preview.sql

# Review the migration SQL
cat migration-preview.sql
```

### Step 4: Apply Database Migration
```bash
# Generate and apply Prisma migration
npx prisma migrate dev --name "add-multi-tenant-architecture"

# Regenerate Prisma client
npx prisma generate
```

### Step 5: Run Data Migration Script
```bash
# Run the data migration to add restaurant relationships
node prisma/migrate-to-multitenant.js
```

## 📋 What the Migration Does

### Data Transformation:
1. **Creates Default Restaurant** from existing restaurant data
2. **Associates All Users** with the default restaurant
3. **Links All Dishes/Ingredients** to the default restaurant  
4. **Creates Demo Restaurants** for testing multi-tenancy
5. **Generates Admin Users** for each demo restaurant

### New Features Added:
- **Restaurant Slugs**: SEO-friendly URLs like `/menu/bella-italia`
- **User Roles**: OWNER, ADMIN, STAFF, VIEWER permissions
- **Tenant Isolation**: Complete data separation between restaurants
- **Invitation System**: Secure way to add users to restaurants

## 🔒 Security Improvements

### Before (Vulnerable):
```sql
-- Any authenticated user could access any restaurant's data
SELECT * FROM dishes;  -- Returns ALL dishes from ALL restaurants
```

### After (Secure):
```sql
-- Data is properly isolated by restaurant
SELECT * FROM dishes WHERE restaurant_id = ?;  -- Only restaurant's dishes
```

## 🧪 Testing Multi-Tenancy

### Test Restaurant Isolation:
```bash
# Connect to database and verify isolation
npx prisma studio

# Check that:
# 1. Each restaurant has its own dishes/ingredients
# 2. Users belong to specific restaurants
# 3. No cross-restaurant data leakage
```

### Demo Restaurants Created:
1. **MenuShield Demo** (`menushield-demo`) - Your existing data
2. **Bella Italia** (`bella-italia`) - Italian restaurant demo
3. **Sushi Zen** (`sushi-zen`) - Japanese restaurant demo  
4. **Green Garden** (`green-garden`) - Plant-based restaurant demo

### Demo Login Credentials:
- `admin@bella-italia.com` / `demo123`
- `admin@sushi-zen.com` / `demo123`
- `admin@green-garden.com` / `demo123`

## 🚨 Rollback Plan

If migration fails:
```bash
# Restore from backup
mysql -u your_username -p menushield < backup_YYYYMMDD_HHMMSS.sql

# Restore old schema
git checkout HEAD~1 -- prisma/schema.prisma
npx prisma db push --force-reset
```

## ✅ Post-Migration Verification

### 1. Check Data Integrity:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const restaurants = await prisma.restaurant.findMany({
    include: { _count: { select: { users: true, dishes: true }}}
  });
  
  console.log('Restaurants:', restaurants.map(r => 
    \`\${r.name} (\${r.slug}): \${r._count.users} users, \${r._count.dishes} dishes\`
  ));
})();
"
```

### 2. Test API Endpoints:
```bash
# Test restaurant-specific endpoints
curl http://localhost:5000/api/restaurant/menushield-demo/menu
curl http://localhost:5000/api/restaurant/bella-italia/menu
```

### 3. Test Authentication:
- Login with original admin account
- Verify access only to default restaurant data
- Login with demo restaurant accounts
- Verify tenant isolation

## 🔄 Updating Application Code

After successful migration, update your API endpoints to include restaurant context:

```javascript
// OLD: Global endpoints
app.get('/api/menu', getMenu);

// NEW: Restaurant-scoped endpoints  
app.get('/api/restaurant/:restaurantSlug/menu', getRestaurantMenu);
```

## 📊 Migration Impact

### Database Changes:
- **Added**: `restaurant_id` foreign keys to all major tables
- **Added**: User roles and restaurant relationships
- **Added**: Restaurant invitation system
- **Enhanced**: Proper data isolation and security

### Application Changes Required:
- ✅ Update API endpoints to include restaurant context
- ✅ Modify authentication middleware for tenant checking
- ✅ Update frontend routing for restaurant slugs
- ✅ Add restaurant selection/switching in admin interface

### Performance Impact:
- **Minimal**: All queries now include `restaurant_id` filter (slight improvement)
- **Improved**: Better indexing for tenant-specific queries
- **Scalable**: Ready for thousands of restaurants

---

**This migration transforms MenuShield from a single-restaurant system into a production-ready multi-tenant SaaS platform with proper security and data isolation.**
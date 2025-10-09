import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting safe MongoDB seed...');

  // Check if demo restaurant already exists
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-restaurant' }
  });

  if (existingRestaurant) {
    console.log('✅ Demo restaurant already exists!');
    console.log(`Restaurant: ${existingRestaurant.name} (${existingRestaurant.slug})`);
    
    // Check if admin user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo-restaurant.com' }
    });
    
    if (existingUser) {
      console.log('✅ Admin user already exists!');
      console.log(`Admin: ${existingUser.email}`);
    } else {
      console.log('👤 Creating missing admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@demo-restaurant.com',
          passwordHash: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'OWNER',
          restaurantId: existingRestaurant.id,
        },
      });
      console.log(`✅ Admin user created: ${adminUser.email}`);
    }
    
    console.log('\n🚀 Database ready! No seed needed.');
    console.log('\n🌐 Access URLs:');
    console.log(`Guest Menu: /r/${existingRestaurant.slug}`);
    console.log(`Admin Panel: /r/${existingRestaurant.slug}/admin`);
    console.log('Login: admin@demo-restaurant.com / admin123');
    return;
  }

  // If no restaurant exists, create everything
  console.log('🏪 Creating demo restaurant...');
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      description: 'A family-friendly restaurant committed to safe dining for all',
      contact: '(555) 123-4567',
      defaultLanguage: 'en',
      supportedLanguages: '["en"]',
      showPrices: true,
      currency: 'EUR',
    },
  });

  console.log(`✅ Restaurant created: ${restaurant.name}`);

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo-restaurant.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'OWNER',
      restaurantId: restaurant.id,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create basic categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Main Course',
        description: 'Hearty main dishes',
        color: 'bg-red-100 text-red-800',
        displayOrder: 1,
        restaurantId: restaurant.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Appetizers',
        description: 'Light starters',
        color: 'bg-green-100 text-green-800',
        displayOrder: 2,
        restaurantId: restaurant.id,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample dishes
  console.log('🍽️ Creating sample dishes...');
  const dishes = [
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
      price: 16.99,
      categoryId: categories[0].id,
      allergenTags: '["gluten", "dairy"]',
      isModifiable: false,
      displayOrder: 1,
    },
    {
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan, croutons, and caesar dressing',
      price: 12.99,
      categoryId: categories[1].id,
      allergenTags: '["dairy", "eggs", "gluten"]',
      isModifiable: true,
      modificationNote: 'Can be made without croutons and parmesan',
      displayOrder: 2,
    },
    {
      name: 'Grilled Chicken',
      description: 'Herb-seasoned grilled chicken breast',
      price: 18.99,
      categoryId: categories[0].id,
      allergenTags: '[]',
      isModifiable: true,
      modificationNote: 'Can be prepared with different seasonings',
      displayOrder: 3,
    },
  ];

  for (const dishData of dishes) {
    await prisma.dish.create({
      data: {
        ...dishData,
        restaurantId: restaurant.id,
      },
    });
  }

  console.log(`✅ Created ${dishes.length} dishes`);

  console.log('\n🎉 MongoDB seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`Restaurant: ${restaurant.name} (${restaurant.slug})`);
  console.log(`Admin: ${adminUser.email} / admin123`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Dishes: ${dishes.length}`);
  console.log('\n🌐 Access URLs:');
  console.log(`Guest Menu: /r/${restaurant.slug}`);
  console.log(`Admin Panel: /r/${restaurant.slug}/admin`);
  console.log('\n🚀 Ready for production!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    // Don't exit with error if data already exists
    if (e.code === 'P2002') {
      console.log('💡 Data already exists, continuing...');
      return;
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
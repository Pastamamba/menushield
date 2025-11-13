import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating new admin user...');
    
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@menushield.com' }
    });
    
    if (existingUser) {
      console.log('Updating existing admin user password...');
      await prisma.user.update({
        where: { email: 'admin@menushield.com' },
        data: { passwordHash }
      });
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Find or create demo restaurant
      let demoRestaurant = await prisma.restaurant.findUnique({
        where: { slug: 'demo-restaurant' }
      });
      
      if (!demoRestaurant) {
        demoRestaurant = await prisma.restaurant.create({
          data: {
            name: 'Demo Restaurant',
            slug: 'demo-restaurant',
            address: 'Demo Address'
          }
        });
        console.log('✅ Demo restaurant created');
      }
      
      // Create admin user
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@menushield.com',
          passwordHash,
          role: 'OWNER',
          restaurantId: demoRestaurant.id
        }
      });
      
      console.log('✅ New admin user created successfully!');
    }
    
    console.log('\n🔑 Admin credentials:');
    console.log('Email: admin@menushield.com');
    console.log('Password: admin123');
    console.log('\nYou can now login with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
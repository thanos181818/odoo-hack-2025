import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('🌱 Seeding database...');

  try {
    // Create locations
    const mainWarehouse = await prisma.location.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Main Warehouse',
        type: 'WAREHOUSE',
        address: '123 Industrial Ave, Mumbai',
      },
    });

    const productionFloor = await prisma.location.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        name: 'Production Floor',
        type: 'PRODUCTION',
        address: 'Building B',
      },
    });

    const retailStore = await prisma.location.upsert({
      where: { id: '3' },
      update: {},
      create: {
        id: '3',
        name: 'Retail Store',
        type: 'STORE',
        address: '456 Market St, Mumbai',
      },
    });

    logger.info('✅ Locations created');

    // Create products
    const steel = await prisma.product.upsert({
      where: { sku: 'STEEL-001' },
      update: {},
      create: {
        sku: 'STEEL-001',
        name: 'Steel Rods',
        description: 'High-grade steel rods for construction',
        unit: 'kg',
        reorderLevel: 200,
        costPrice: 50,
        sellingPrice: 75,
        category: 'Raw Materials',
      },
    });

    const cement = await prisma.product.upsert({
      where: { sku: 'CEM-001' },
      update: {},
      create: {
        sku: 'CEM-001',
        name: 'Cement Bags',
        description: 'Premium Portland cement 50kg bags',
        unit: 'bags',
        reorderLevel: 100,
        costPrice: 300,
        sellingPrice: 450,
        category: 'Raw Materials',
      },
    });

    const chairs = await prisma.product.upsert({
      where: { sku: 'CHAIR-001' },
      update: {},
      create: {
        sku: 'CHAIR-001',
        name: 'Office Chairs',
        description: 'Ergonomic office chairs with lumbar support',
        unit: 'pcs',
        reorderLevel: 50,
        costPrice: 2000,
        sellingPrice: 3500,
        category: 'Furniture',
      },
    });

    const tables = await prisma.product.upsert({
      where: { sku: 'TABLE-001' },
      update: {},
      create: {
        sku: 'TABLE-001',
        name: 'Conference Tables',
        description: 'Large wooden conference tables',
        unit: 'pcs',
        reorderLevel: 20,
        costPrice: 5000,
        sellingPrice: 8500,
        category: 'Furniture',
      },
    });

    logger.info('✅ Products created');

    // Create initial stock
    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: steel.id,
          locationId: mainWarehouse.id,
        },
      },
      update: {},
      create: {
        productId: steel.id,
        locationId: mainWarehouse.id,
        quantity: 500,
      },
    });

    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: cement.id,
          locationId: mainWarehouse.id,
        },
      },
      update: {},
      create: {
        productId: cement.id,
        locationId: mainWarehouse.id,
        quantity: 250,
      },
    });

    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: chairs.id,
          locationId: retailStore.id,
        },
      },
      update: {},
      create: {
        productId: chairs.id,
        locationId: retailStore.id,
        quantity: 75,
      },
    });

    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: steel.id,
          locationId: productionFloor.id,
        },
      },
      update: {},
      create: {
        productId: steel.id,
        locationId: productionFloor.id,
        quantity: 42, // Intentionally low for testing
      },
    });

    logger.info('✅ Stock levels created');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@stockmaster.com' },
      update: {},
      create: {
        email: 'admin@stockmaster.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    await prisma.user.upsert({
      where: { email: 'manager@stockmaster.com' },
      update: {},
      create: {
        email: 'manager@stockmaster.com',
        password: hashedPassword,
        name: 'Warehouse Manager',
        role: 'MANAGER',
      },
    });

    logger.info('✅ Users created');
    logger.info('✅ Database seeded successfully!');
    logger.info('\nTest credentials:');
    logger.info('- admin@stockmaster.com / password123');
    logger.info('- manager@stockmaster.com / password123');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
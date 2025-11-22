import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Initialize the Prisma Client
// We can add log levels here for better debugging in development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * Connect to the database
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

// Export the prisma instance as the default export
// This fixes the "Cannot read properties of undefined (reading 'findMany')" error
export default prisma;
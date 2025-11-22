import { PrismaClient } from "@prisma/client";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    logger.info("🔧 Setting up database...");

    // Test connection
    await prisma.$connect();
    logger.info("✅ Database connection successful");

    // Enable pgvector extension
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
      logger.info("✅ pgvector extension enabled");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        logger.info("✅ pgvector extension already enabled");
      } else {
        throw error;
      }
    }

    // Create vector index for Product
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS product_embedding_idx 
        ON "Product" 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `;
      logger.info("✅ Product embedding index created");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        logger.info("✅ Product embedding index already exists");
      } else {
        logger.warn("⚠️ Could not create index (will be auto-created on first query)");
      }
    }

    // Create vector index for Location
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS location_embedding_idx 
        ON "Location" 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 10)
      `;
      logger.info("✅ Location embedding index created");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        logger.info("✅ Location embedding index already exists");
      } else {
        logger.warn("⚠️ Could not create index (will be auto-created on first query)");
      }
    }

    // Verify tables exist
    const tables = await prisma.$queryRaw<any[]>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    const expectedTables = [
      "Product",
      "Location",
      "Stock",
      "Move",
      "MoveItem",
      "User",
      "Conversation"
    ];

    const existingTables = tables.map((t) => t.tablename);

    const missingTables = expectedTables.filter(
      (t) => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      logger.warn(`⚠️ Missing tables: ${missingTables.join(", ")}`);
      logger.warn("   Run: npm run db:push or npm run db:migrate");
    } else {
      logger.info("✅ All required tables exist");
    }

    logger.info("\n🎉 Database setup complete!");
    logger.info("\nNext steps:");
    logger.info("1. Run: npm run db:seed (load sample data)");
    logger.info("2. Run: npm run embeddings (generate embeddings)");
    logger.info("3. Run: npm run dev (start server)");
  } catch (error) {
    logger.error("❌ Database setup failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});

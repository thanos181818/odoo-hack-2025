import prisma from '../config/database';
import { getEmbeddingsModel } from '../config/llm';
import { logger } from '../utils/logger';

export class VectorStoreService {
  private embeddings = getEmbeddingsModel();

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddings.embedQuery(text);
      return result;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Semantic search for products
   */
  async searchProducts(query: string, limit: number = 5) {
    const embedding = await this.generateEmbedding(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        id, sku, name, description, unit, "reorderLevel", category,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Product"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Semantic search for locations
   */
  async searchLocations(query: string, limit: number = 5) {
    const embedding = await this.generateEmbedding(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        id, name, type, address,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Location"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Update product embedding
   */
  async updateProductEmbedding(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new Error('Product not found');

    const text = `${product.name} ${product.description || ''} ${product.category || ''}`;
    const embedding = await this.generateEmbedding(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      UPDATE "Product"
      SET embedding = ${embeddingStr}::vector
      WHERE id = ${productId}
    `;

    logger.info(`Updated embedding for product: ${product.name}`);
  }

  /**
   * Update location embedding
   */
  async updateLocationEmbedding(locationId: string) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) throw new Error('Location not found');

    const text = `${location.name} ${location.type} ${location.address || ''}`;
    const embedding = await this.generateEmbedding(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      UPDATE "Location"
      SET embedding = ${embeddingStr}::vector
      WHERE id = ${locationId}
    `;

    logger.info(`Updated embedding for location: ${location.name}`);
  }

  /**
   * Batch update all embeddings
   */
  async updateAllEmbeddings() {
    logger.info('Starting batch embedding update...');

    // Update products
    const products = await prisma.product.findMany();
    for (const product of products) {
      await this.updateProductEmbedding(product.id);
    }

    // Update locations
    const locations = await prisma.location.findMany();
    for (const location of locations) {
      await this.updateLocationEmbedding(location.id);
    }

    logger.info('✅ All embeddings updated');
  }
}

export const vectorStore = new VectorStoreService();
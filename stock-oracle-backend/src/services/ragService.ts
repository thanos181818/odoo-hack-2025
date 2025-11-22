import prisma from '../config/database';
import { vectorStore } from './vectorStore';
import { logger } from '../utils/logger';

export interface RAGContext {
  products: any[];
  locations: any[];
  recentMoves: any[];
  stockLevels: any[];
  kpis: {
    totalValue: number;
    lowStockCount: number;
    pendingOperations: number;
  };
}

export class RAGService {
  /**
   * Retrieve relevant context for a query
   */
  async retrieveContext(query: string, userId: string): Promise<RAGContext> {
    logger.debug(`Retrieving RAG context for query: "${query}"`);

    // Parallel retrieval for speed
    const [
      semanticProducts,
      semanticLocations,
      recentMoves,
      lowStock,
      kpis,
    ] = await Promise.all([
      vectorStore.searchProducts(query, 5),
      vectorStore.searchLocations(query, 3),
      this.getRecentMoves(10),
      this.getLowStockItems(),
      this.getKPIs(),
    ]);

    // Get current stock for relevant products
    const productIds = semanticProducts.map(p => p.id);
    const stockLevels = await prisma.stock.findMany({
      where: { productId: { in: productIds } },
      include: {
        product: true,
        location: true,
      },
    });

    return {
      products: semanticProducts,
      locations: semanticLocations,
      recentMoves,
      stockLevels,
      kpis,
    };
  }

  /**
   * Get recent move history
   */
  private async getRecentMoves(limit: number = 10) {
    return prisma.move.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: true,
        toLocation: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });
  }

  /**
   * Get low stock items
   */
  private async getLowStockItems() {
    const lowStockData = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id, p.name, p.sku, p."reorderLevel",
        l.name as location,
        s.quantity,
        (p."reorderLevel" - s.quantity) as deficit
      FROM "Product" p
      JOIN "Stock" s ON p.id = s."productId"
      JOIN "Location" l ON s."locationId" = l.id
      WHERE s.quantity < p."reorderLevel"
      ORDER BY deficit DESC
      LIMIT 10
    `;

    return lowStockData;
  }

  /**
   * Calculate key performance indicators
   */
  private async getKPIs() {
    const [totalValue, lowStockCount, pendingOps] = await Promise.all([
      this.getTotalStockValue(),
      this.getLowStockCount(),
      this.getPendingOperationsCount(),
    ]);

    return {
      totalValue,
      lowStockCount,
      pendingOperations: pendingOps,
    };
  }

  private async getTotalStockValue() {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(SUM(s.quantity * p."costPrice"), 0) as total
      FROM "Stock" s
      JOIN "Product" p ON s."productId" = p.id
      WHERE p."costPrice" IS NOT NULL
    `;
    return result[0]?.total || 0;
  }

  private async getLowStockCount() {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT s."productId") as count
      FROM "Stock" s
      JOIN "Product" p ON s."productId" = p.id
      WHERE s.quantity < p."reorderLevel"
    `;
    return result[0]?.count || 0;
  }

  private async getPendingOperationsCount() {
    return prisma.move.count({
      where: {
        status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] },
      },
    });
  }

  /**
   * Format context for LLM prompt
   */
  formatContextForLLM(context: RAGContext): string {
    let formatted = '# Current System State\n\n';

    // KPIs
    formatted += '## Key Metrics\n';
    formatted += `- Total Stock Value: $${context.kpis.totalValue.toFixed(2)}\n`;
    formatted += `- Low Stock Items: ${context.kpis.lowStockCount}\n`;
    formatted += `- Pending Operations: ${context.kpis.pendingOperations}\n\n`;

    // Relevant products
    if (context.products.length > 0) {
      formatted += '## Relevant Products\n';
      context.products.forEach(p => {
        formatted += `- ${p.name} (SKU: ${p.sku})\n`;
        formatted += `  Reorder Level: ${p.reorderLevel} ${p.unit}\n`;
      });
      formatted += '\n';
    }

    // Stock levels
    if (context.stockLevels.length > 0) {
      formatted += '## Current Stock Levels\n';
      context.stockLevels.forEach(s => {
        formatted += `- ${s.product.name} @ ${s.location.name}: ${s.quantity} ${s.product.unit}\n`;
      });
      formatted += '\n';
    }

    // Recent activity
    if (context.recentMoves.length > 0) {
      formatted += '## Recent Operations\n';
      context.recentMoves.slice(0, 5).forEach(m => {
        formatted += `- ${m.type} (${m.status}) - ${m.createdBy.name}\n`;
        m.items.forEach((item: any) => {
          formatted += `  → ${item.product.name}: ${item.quantity}\n`;
        });
      });
    }

    return formatted;
  }
}

export const ragService = new RAGService();
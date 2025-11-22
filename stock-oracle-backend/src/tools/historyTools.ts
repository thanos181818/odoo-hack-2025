import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '../config/database';
import { vectorStore } from '../services/vectorStore';

/**
 * Get pending operations
 */
export const getPendingOperationsTool = new DynamicStructuredTool({
  name: 'get_pending_operations',
  description: 'Get all pending/draft operations that require approval',
  schema: z.object({
    type: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT', 'ALL']).optional()
      .describe('Filter by operation type'),
  }),
  func: async ({ type }) => {
    const where: any = {
      status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] },
    };

    if (type && type !== 'ALL') {
      where.type = type;
    }

    const operations = await prisma.move.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        fromLocation: true,
        toLocation: true,
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (operations.length === 0) {
      return 'No pending operations';
    }

    const result = operations.map(op => {
      const items = op.items.map(i => 
        `    - ${i.product.name}: ${i.quantity} ${i.product.unit}`
      ).join('\n');

      let locationInfo = '';
      if (op.type === 'RECEIPT') {
        locationInfo = `  To: ${op.toLocation?.name}\n  Supplier: ${op.supplier}`;
      } else if (op.type === 'DELIVERY') {
        locationInfo = `  From: ${op.fromLocation?.name}\n  Customer: ${op.customer}`;
      } else if (op.type === 'TRANSFER') {
        locationInfo = `  From: ${op.fromLocation?.name} → To: ${op.toLocation?.name}`;
      }

      return `${op.type} - ${op.referenceNo} (${op.status})\n` +
             `  Created: ${op.createdAt.toISOString().split('T')[0]} by ${op.createdBy.name}\n` +
             `${locationInfo}\n` +
             `  Items:\n${items}`;
    }).join('\n\n');

    return `Pending Operations (${operations.length}):\n\n${result}`;
  },
});

/**
 * Search move history
 */
export const searchMoveHistoryTool = new DynamicStructuredTool({
  name: 'search_move_history',
  description: 'Search historical operations by product, location, or date range',
  schema: z.object({
    productName: z.string().optional(),
    locationName: z.string().optional(),
    type: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT']).optional(),
    daysAgo: z.number().optional().describe('Number of days to look back (default: 30)'),
  }),
  func: async ({ productName, locationName, type, daysAgo = 30 }) => {
    const where: any = {
      status: 'COMPLETED',
      createdAt: {
        gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    };

    if (type) {
      where.type = type;
    }

    // If product specified, filter by items
    if (productName) {
      const products = await vectorStore.searchProducts(productName, 1);
      if (products.length === 0) {
        return `Product "${productName}" not found`;
      }
      where.items = {
        some: { productId: products[0].id },
      };
    }

    // If location specified, filter by from/to
    if (locationName) {
      const locations = await vectorStore.searchLocations(locationName, 1);
      if (locations.length === 0) {
        return `Location "${locationName}" not found`;
      }
      where.OR = [
        { fromLocationId: locations[0].id },
        { toLocationId: locations[0].id },
      ];
    }

    const moves = await prisma.move.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        fromLocation: true,
        toLocation: true,
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { completedDate: 'desc' },
      take: 15,
    });

    if (moves.length === 0) {
      return 'No matching operations found in history';
    }

    const result = moves.map(m => {
      const items = m.items.map(i => 
        `    - ${i.product.name}: ${i.quantity} ${i.product.unit}`
      ).join('\n');

      let locationInfo = '';
      if (m.type === 'RECEIPT') {
        locationInfo = `  To: ${m.toLocation?.name}\n  Supplier: ${m.supplier}`;
      } else if (m.type === 'DELIVERY') {
        locationInfo = `  From: ${m.fromLocation?.name}\n  Customer: ${m.customer}`;
      } else if (m.type === 'TRANSFER') {
        locationInfo = `  From: ${m.fromLocation?.name} → To: ${m.toLocation?.name}`;
      } else if (m.type === 'ADJUSTMENT') {
        locationInfo = `  Location: ${m.toLocation?.name}\n  Reason: ${m.reason}`;
      }

      return `${m.type} - ${m.referenceNo}\n` +
             `  Date: ${m.completedDate?.toISOString().split('T')[0]}\n` +
             `  By: ${m.createdBy.name}\n` +
             `${locationInfo}\n` +
             `  Items:\n${items}`;
    }).join('\n\n');

    return `Found ${moves.length} operations:\n\n${result}`;
  },
});

/**
 * Get operation details
 */
export const getOperationDetailsTool = new DynamicStructuredTool({
  name: 'get_operation_details',
  description: 'Get detailed information about a specific operation by reference number',
  schema: z.object({
    referenceNo: z.string().describe('Reference number (e.g., REC-123456)'),
  }),
  func: async ({ referenceNo }) => {
    const operation = await prisma.move.findUnique({
      where: { referenceNo },
      include: {
        items: {
          include: { product: true },
        },
        fromLocation: true,
        toLocation: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!operation) {
      return `Operation "${referenceNo}" not found`;
    }

    const items = operation.items.map(i => 
      `  - ${i.product.name} (${i.product.sku}): ${i.quantity} ${i.product.unit}`
    ).join('\n');

    let locationInfo = '';
    if (operation.type === 'RECEIPT') {
      locationInfo = `To Location: ${operation.toLocation?.name}\nSupplier: ${operation.supplier}`;
    } else if (operation.type === 'DELIVERY') {
      locationInfo = `From Location: ${operation.fromLocation?.name}\nCustomer: ${operation.customer}`;
    } else if (operation.type === 'TRANSFER') {
      locationInfo = `From: ${operation.fromLocation?.name}\nTo: ${operation.toLocation?.name}`;
    } else if (operation.type === 'ADJUSTMENT') {
      locationInfo = `Location: ${operation.toLocation?.name}\nReason: ${operation.reason}`;
    }

    return `Operation Details: ${operation.referenceNo}\n` +
           `Type: ${operation.type}\n` +
           `Status: ${operation.status}\n` +
           `${locationInfo}\n` +
           `Created: ${operation.createdAt.toISOString()}\n` +
           `Created By: ${operation.createdBy.name} (${operation.createdBy.email})\n` +
           `Completed: ${operation.completedDate?.toISOString() || 'Not completed'}\n` +
           `Notes: ${operation.notes || 'None'}\n\n` +
           `Items:\n${items}`;
  },
});
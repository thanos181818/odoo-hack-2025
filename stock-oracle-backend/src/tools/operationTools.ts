import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '../config/database';
import { vectorStore } from '../services/vectorStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a receipt (incoming goods from supplier)
 */
export const createReceiptTool = new DynamicStructuredTool({
  name: 'create_receipt',
  description: 'Create a draft receipt for incoming goods from supplier. Returns draft ID for approval.',
  schema: z.object({
    items: z.array(z.object({
      productName: z.string(),
      quantity: z.number(),
    })).describe('List of products and quantities to receive'),
    supplier: z.string().describe('Supplier name'),
    toLocationName: z.string().describe('Destination location'),
    notes: z.string().optional().describe('Additional notes'),
  }),
  func: async ({ items, supplier, toLocationName, notes }) => {
    // Find destination location
    const locations = await vectorStore.searchLocations(toLocationName, 1);
    if (locations.length === 0) {
      return `Error: Location "${toLocationName}" not found`;
    }
    const toLocation = locations[0];

    // Find products
    const moveItems = [];
    for (const item of items) {
      const products = await vectorStore.searchProducts(item.productName, 1);
      if (products.length === 0) {
        return `Error: Product "${item.productName}" not found`;
      }
      moveItems.push({
        productId: products[0].id,
        quantity: item.quantity,
      });
    }

    // Create draft receipt
    const receipt = await prisma.move.create({
      data: {
        type: 'RECEIPT',
        status: 'DRAFT',
        referenceNo: `REC-${Date.now()}`,
        supplier,
        toLocationId: toLocation.id,
        notes,
        createdById: 'system', // Will be replaced with actual user ID from JWT
        items: {
          create: moveItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        toLocation: true,
      },
    });

    const itemsList = receipt.items.map(i => 
      `  - ${i.product.name}: ${i.quantity} ${i.product.unit}`
    ).join('\n');

    return `✅ Draft Receipt Created (ID: ${receipt.id})\n` +
           `Reference: ${receipt.referenceNo}\n` +
           `Supplier: ${receipt.supplier}\n` +
           `To: ${receipt.toLocation?.name}\n` +
           `Items:\n${itemsList}\n\n` +
           `Status: DRAFT - Awaiting approval`;
  },
});

/**
 * Create a delivery (outgoing goods to customer)
 */
export const createDeliveryTool = new DynamicStructuredTool({
  name: 'create_delivery',
  description: 'Create a draft delivery order for outgoing goods to customer',
  schema: z.object({
    items: z.array(z.object({
      productName: z.string(),
      quantity: z.number(),
    })).describe('List of products and quantities to deliver'),
    customer: z.string().describe('Customer name'),
    fromLocationName: z.string().describe('Source location'),
    notes: z.string().optional(),
  }),
  func: async ({ items, customer, fromLocationName, notes }) => {
    const locations = await vectorStore.searchLocations(fromLocationName, 1);
    if (locations.length === 0) {
      return `Error: Location "${fromLocationName}" not found`;
    }
    const fromLocation = locations[0];

    // Check stock availability
    const moveItems = [];
    for (const item of items) {
      const products = await vectorStore.searchProducts(item.productName, 1);
      if (products.length === 0) {
        return `Error: Product "${item.productName}" not found`;
      }

      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: products[0].id,
            locationId: fromLocation.id,
          },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        return `Error: Insufficient stock for ${item.productName}. ` +
               `Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`;
      }

      moveItems.push({
        productId: products[0].id,
        quantity: item.quantity,
      });
    }

    const delivery = await prisma.move.create({
      data: {
        type: 'DELIVERY',
        status: 'DRAFT',
        referenceNo: `DEL-${Date.now()}`,
        customer,
        fromLocationId: fromLocation.id,
        notes,
        createdById: 'system',
        items: {
          create: moveItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        fromLocation: true,
      },
    });

    const itemsList = delivery.items.map(i => 
      `  - ${i.product.name}: ${i.quantity} ${i.product.unit}`
    ).join('\n');

    return `✅ Draft Delivery Created (ID: ${delivery.id})\n` +
           `Reference: ${delivery.referenceNo}\n` +
           `Customer: ${delivery.customer}\n` +
           `From: ${delivery.fromLocation?.name}\n` +
           `Items:\n${itemsList}\n\n` +
           `Status: DRAFT - Awaiting approval`;
  },
});

/**
 * Create an internal transfer between locations
 */
export const createTransferTool = new DynamicStructuredTool({
  name: 'create_transfer',
  description: 'Create a draft internal transfer between two locations',
  schema: z.object({
    items: z.array(z.object({
      productName: z.string(),
      quantity: z.number(),
    })),
    fromLocationName: z.string(),
    toLocationName: z.string(),
    notes: z.string().optional(),
  }),
  func: async ({ items, fromLocationName, toLocationName, notes }) => {
    const fromLocs = await vectorStore.searchLocations(fromLocationName, 1);
    const toLocs = await vectorStore.searchLocations(toLocationName, 1);

    if (fromLocs.length === 0) {
      return `Error: Location "${fromLocationName}" not found`;
    }
    if (toLocs.length === 0) {
      return `Error: Location "${toLocationName}" not found`;
    }

    const fromLocation = fromLocs[0];
    const toLocation = toLocs[0];

    // Check stock availability
    const moveItems = [];
    for (const item of items) {
      const products = await vectorStore.searchProducts(item.productName, 1);
      if (products.length === 0) {
        return `Error: Product "${item.productName}" not found`;
      }

      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: products[0].id,
            locationId: fromLocation.id,
          },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        return `Error: Insufficient stock for ${item.productName} at ${fromLocationName}. ` +
               `Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`;
      }

      moveItems.push({
        productId: products[0].id,
        quantity: item.quantity,
      });
    }

    const transfer = await prisma.move.create({
      data: {
        type: 'TRANSFER',
        status: 'DRAFT',
        referenceNo: `TRF-${Date.now()}`,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        notes,
        createdById: 'system',
        items: {
          create: moveItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        fromLocation: true,
        toLocation: true,
      },
    });

    const itemsList = transfer.items.map(i => 
      `  - ${i.product.name}: ${i.quantity} ${i.product.unit}`
    ).join('\n');

    return `✅ Draft Transfer Created (ID: ${transfer.id})\n` +
           `Reference: ${transfer.referenceNo}\n` +
           `From: ${transfer.fromLocation?.name} → To: ${transfer.toLocation?.name}\n` +
           `Items:\n${itemsList}\n\n` +
           `Status: DRAFT - Awaiting approval`;
  },
});

/**
 * Create a stock adjustment
 */
export const createAdjustmentTool = new DynamicStructuredTool({
  name: 'create_adjustment',
  description: 'Create a stock adjustment to correct inventory counts (e.g., after physical count)',
  schema: z.object({
    productName: z.string(),
    locationName: z.string(),
    newQuantity: z.number(),
    reason: z.string().describe('Reason for adjustment (e.g., physical count, damage, theft)'),
  }),
  func: async ({ productName, locationName, newQuantity, reason }) => {
    const products = await vectorStore.searchProducts(productName, 1);
    const locations = await vectorStore.searchLocations(locationName, 1);

    if (products.length === 0) {
      return `Error: Product "${productName}" not found`;
    }
    if (locations.length === 0) {
      return `Error: Location "${locationName}" not found`;
    }

    const product = products[0];
    const location = locations[0];

    // Get current stock
    const currentStock = await prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: location.id,
        },
      },
    });

    const oldQuantity = currentStock?.quantity || 0;
    const difference = newQuantity - oldQuantity;

    const adjustment = await prisma.move.create({
      data: {
        type: 'ADJUSTMENT',
        status: 'DRAFT',
        referenceNo: `ADJ-${Date.now()}`,
        toLocationId: location.id,
        reason,
        notes: `Adjustment: ${oldQuantity} → ${newQuantity} (${difference >= 0 ? '+' : ''}${difference})`,
        createdById: 'system',
        items: {
          create: {
            productId: product.id,
            quantity: difference,
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        toLocation: true,
      },
    });

    return `✅ Stock Adjustment Created (ID: ${adjustment.id})\n` +
           `Reference: ${adjustment.referenceNo}\n` +
           `Product: ${product.name}\n` +
           `Location: ${location.name}\n` +
           `Old Quantity: ${oldQuantity} ${product.unit}\n` +
           `New Quantity: ${newQuantity} ${product.unit}\n` +
           `Difference: ${difference >= 0 ? '+' : ''}${difference} ${product.unit}\n` +
           `Reason: ${reason}\n\n` +
           `Status: DRAFT - Awaiting approval`;
  },
});
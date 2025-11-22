import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '../config/database';
import { vectorStore } from '../services/vectorStore';

/**
 * Get current stock for a product at a location
 */
export const getStockTool = new DynamicStructuredTool({
  name: 'get_stock',
  description: 'Get current stock quantity for a product at a specific location or all locations',
  schema: z.object({
    productName: z.string().describe('Product name or SKU'),
    locationName: z.string().optional().describe('Location name (optional, if not provided returns all locations)'),
  }),
  func: async ({ productName, locationName }) => {
    // Semantic search for product
    const products = await vectorStore.searchProducts(productName, 1);
    if (products.length === 0) {
      return `Product "${productName}" not found in inventory`;
    }

    const product = products[0];
    const where: any = { productId: product.id };

    // If location specified, find it
    if (locationName) {
      const locations = await vectorStore.searchLocations(locationName, 1);
      if (locations.length === 0) {
        return `Location "${locationName}" not found`;
      }
      where.locationId = locations[0].id;
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: true,
        location: true,
      },
    });

    if (stocks.length === 0) {
      return `No stock found for ${product.name}${locationName ? ` at ${locationName}` : ''}`;
    }

    const result = stocks.map(s => 
      `${s.product.name} @ ${s.location.name}: ${s.quantity} ${s.product.unit}`
    ).join('\n');

    return result;
  },
});

/**
 * Get low stock items
 */
export const getLowStockTool = new DynamicStructuredTool({
  name: 'get_low_stock',
  description: 'Get all products that are below their reorder level',
  schema: z.object({
    locationName: z.string().optional().describe('Filter by location (optional)'),
  }),
  func: async ({ locationName }) => {
    let locationFilter = '';
    if (locationName) {
      const locations = await vectorStore.searchLocations(locationName, 1);
      if (locations.length > 0) {
        locationFilter = `AND l.id = '${locations[0].id}'`;
      }
    }

    const lowStock = await prisma.$queryRaw<any[]>`
      SELECT 
        p.name, p.sku, l.name as location,
        s.quantity, p."reorderLevel", p.unit,
        (p."reorderLevel" - s.quantity) as deficit
      FROM "Product" p
      JOIN "Stock" s ON p.id = s."productId"
      JOIN "Location" l ON s."locationId" = l.id
      WHERE s.quantity < p."reorderLevel" ${locationFilter}
      ORDER BY deficit DESC
      LIMIT 20
    `;

    if (lowStock.length === 0) {
      return 'No items below reorder level';
    }

    const result = lowStock.map(item => 
      `⚠️ ${item.name} @ ${item.location}: ${item.quantity}/${item.reorderLevel} ${item.unit} (need ${item.deficit} more)`
    ).join('\n');

    return result;
  },
});

/**
 * Get all stock at a location
 */
export const getLocationStockTool = new DynamicStructuredTool({
  name: 'get_location_stock',
  description: 'Get all products and quantities at a specific location',
  schema: z.object({
    locationName: z.string().describe('Location name'),
  }),
  func: async ({ locationName }) => {
    const locations = await vectorStore.searchLocations(locationName, 1);
    if (locations.length === 0) {
      return `Location "${locationName}" not found`;
    }

    const location = locations[0];
    const stocks = await prisma.stock.findMany({
      where: { locationId: location.id },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });

    if (stocks.length === 0) {
      return `No stock found at ${location.name}`;
    }

    const result = stocks.map(s => 
      `${s.product.name} (${s.product.sku}): ${s.quantity} ${s.product.unit}`
    ).join('\n');

    return `Stock at ${location.name}:\n${result}`;
  },
});

/**
 * Calculate total stock value
 */
export const getStockValueTool = new DynamicStructuredTool({
  name: 'get_stock_value',
  description: 'Calculate total value of current inventory',
  schema: z.object({
    locationName: z.string().optional().describe('Filter by location (optional)'),
  }),
  func: async ({ locationName }) => {
    let locationFilter = '';
    if (locationName) {
      const locations = await vectorStore.searchLocations(locationName, 1);
      if (locations.length > 0) {
        locationFilter = `AND l.id = '${locations[0].id}'`;
      }
    }

    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(s.quantity * p."costPrice"), 0) as "totalValue",
        COUNT(DISTINCT p.id) as "productCount",
        SUM(s.quantity) as "totalQuantity"
      FROM "Stock" s
      JOIN "Product" p ON s."productId" = p.id
      JOIN "Location" l ON s."locationId" = l.id
      WHERE p."costPrice" IS NOT NULL ${locationFilter}
    `;

    const data = result[0];
    return `Total Stock Value: $${Number(data.totalValue).toFixed(2)}\n` +
           `Products: ${data.productCount}\n` +
           `Total Units: ${data.totalQuantity}`;
  },
});
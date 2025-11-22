// Mock data for StockMaster
import type { User, Warehouse, StockLocation, Product, StockQuant, Receipt, Delivery, StockMove } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    loginId: "admin",
    email: "admin@stockmaster.com",
    name: "Admin User",
    role: "MANAGER",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    loginId: "staff1",
    email: "staff@stockmaster.com",
    name: "John Staff",
    role: "STAFF",
    createdAt: new Date("2024-01-15"),
  },
]

export const mockWarehouses: Warehouse[] = [
  {
    id: "1",
    name: "Main Warehouse",
    shortCode: "WH01",
    address: "123 Industrial Ave, Mumbai 400001",
  },
  {
    id: "2",
    name: "Secondary Warehouse",
    shortCode: "WH02",
    address: "456 Storage Rd, Delhi 110001",
  },
]

export const mockLocations: StockLocation[] = [
  {
    id: "1",
    warehouseId: "1",
    name: "Rack A1",
    shortCode: "A1",
    description: "Ground floor, left section",
  },
  {
    id: "2",
    warehouseId: "1",
    name: "Rack A2",
    shortCode: "A2",
    description: "Ground floor, middle section",
  },
  {
    id: "3",
    warehouseId: "1",
    name: "Rack B1",
    shortCode: "B1",
    description: "First floor, left section",
  },
  {
    id: "4",
    warehouseId: "2",
    name: "Rack C1",
    shortCode: "C1",
    description: "Ground floor",
  },
]

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Widget Pro 2000",
    sku: "WID-2000",
    category: "Electronics",
    uom: "pcs",
    perUnitCost: 150,
    reorderQty: 50,
    initialStock: 200,
  },
  {
    id: "2",
    name: "Gadget Ultra",
    sku: "GAD-ULT",
    category: "Electronics",
    uom: "pcs",
    perUnitCost: 250,
    reorderQty: 30,
    initialStock: 100,
  },
  {
    id: "3",
    name: "Component X",
    sku: "CMP-X",
    category: "Parts",
    uom: "pcs",
    perUnitCost: 25,
    reorderQty: 200,
    initialStock: 500,
  },
  {
    id: "4",
    name: "Assembly Kit",
    sku: "ASM-KIT",
    category: "Kits",
    uom: "kit",
    perUnitCost: 500,
    reorderQty: 20,
    initialStock: 45,
  },
  {
    id: "5",
    name: "Battery Pack",
    sku: "BAT-PACK",
    category: "Power",
    uom: "pcs",
    perUnitCost: 75,
    reorderQty: 100,
    initialStock: 15,
  },
]

export const mockStockQuants: StockQuant[] = [
  { id: "1", productId: "1", locationId: "1", quantity: 120, reserved: 10 },
  { id: "2", productId: "1", locationId: "2", quantity: 80, reserved: 5 },
  { id: "3", productId: "2", locationId: "1", quantity: 100, reserved: 0 },
  { id: "4", productId: "3", locationId: "2", quantity: 450, reserved: 50 },
  { id: "5", productId: "3", locationId: "3", quantity: 50, reserved: 0 },
  { id: "6", productId: "4", locationId: "1", quantity: 45, reserved: 5 },
  { id: "7", productId: "5", locationId: "1", quantity: 15, reserved: 0 },
]

export const mockReceipts: Receipt[] = [
  {
    id: "1",
    reference: "WH/IN/0001",
    warehouseId: "1",
    supplier: "Tech Supplies Inc.",
    scheduleDate: new Date("2024-01-20"),
    status: "READY",
    responsibleUserId: "1",
    lines: [
      { id: "1", receiptId: "1", productId: "1", quantity: 100, done: 0 },
      { id: "2", receiptId: "1", productId: "2", quantity: 50, done: 0 },
    ],
  },
  {
    id: "2",
    reference: "WH/IN/0002",
    warehouseId: "1",
    supplier: "Component Corp.",
    scheduleDate: new Date("2024-01-18"),
    status: "DONE",
    responsibleUserId: "2",
    lines: [{ id: "3", receiptId: "2", productId: "3", quantity: 200, done: 200 }],
  },
  {
    id: "3",
    reference: "WH/IN/0003",
    warehouseId: "1",
    supplier: "Power Systems Ltd.",
    scheduleDate: new Date("2024-01-15"),
    status: "DRAFT",
    responsibleUserId: "1",
    lines: [{ id: "4", receiptId: "3", productId: "5", quantity: 150, done: 0 }],
  },
]

export const mockDeliveries: Delivery[] = [
  {
    id: "1",
    reference: "WH/OUT/0001",
    warehouseId: "1",
    toContact: "Customer ABC Ltd.",
    scheduleDate: new Date("2024-01-21"),
    status: "READY",
    responsibleUserId: "1",
    lines: [
      { id: "1", deliveryId: "1", productId: "1", quantity: 50, done: 0 },
      { id: "2", deliveryId: "1", productId: "4", quantity: 10, done: 0 },
    ],
  },
  {
    id: "2",
    reference: "WH/OUT/0002",
    warehouseId: "1",
    toContact: "XYZ Enterprises",
    scheduleDate: new Date("2024-01-22"),
    status: "WAITING",
    responsibleUserId: "2",
    lines: [{ id: "3", deliveryId: "2", productId: "5", quantity: 100, done: 0 }],
    shortages: [{ productId: "5", needed: 100, available: 15 }],
  },
  {
    id: "3",
    reference: "WH/OUT/0003",
    warehouseId: "1",
    toContact: "Retail Partners Inc.",
    scheduleDate: new Date("2024-01-19"),
    status: "DONE",
    responsibleUserId: "1",
    lines: [{ id: "4", deliveryId: "3", productId: "2", quantity: 25, done: 25 }],
  },
]

export const mockStockMoves: StockMove[] = [
  {
    id: "1",
    reference: "WH/IN/0002",
    type: "RECEIPT",
    productId: "3",
    toLocationId: "2",
    qty: 200,
    createdBy: "2",
    createdAt: new Date("2024-01-18T10:30:00"),
  },
  {
    id: "2",
    reference: "WH/OUT/0003",
    type: "DELIVERY",
    productId: "2",
    fromLocationId: "1",
    qty: 25,
    createdBy: "1",
    createdAt: new Date("2024-01-19T14:20:00"),
  },
  {
    id: "3",
    reference: "INT/TR/0001",
    type: "TRANSFER",
    productId: "3",
    fromLocationId: "2",
    toLocationId: "3",
    qty: 50,
    createdBy: "1",
    createdAt: new Date("2024-01-17T09:15:00"),
  },
  {
    id: "4",
    reference: "ADJ/0001",
    type: "ADJUSTMENT",
    productId: "1",
    toLocationId: "1",
    qty: -5,
    createdBy: "2",
    createdAt: new Date("2024-01-16T16:45:00"),
  },
]

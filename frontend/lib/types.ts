// Core data types for StockMaster

export type UserRole = "MANAGER" | "STAFF"

export interface User {
  id: string
  loginId: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

export interface Warehouse {
  id: string
  name: string
  shortCode: string
  address: string
}

export interface StockLocation {
  id: string
  warehouseId: string
  name: string
  shortCode: string
  description?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  uom: string
  perUnitCost: number
  reorderQty: number
  initialStock?: number
}

export interface StockQuant {
  id: string
  productId: string
  locationId: string
  quantity: number
  reserved: number
}

export type StockMoveType = "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT"

export interface StockMove {
  id: string
  reference: string
  type: StockMoveType
  productId: string
  fromLocationId?: string
  toLocationId?: string
  qty: number
  createdBy: string
  createdAt: Date
}

export type OperationStatus = "DRAFT" | "READY" | "WAITING" | "DONE" | "CANCELLED"

export interface Receipt {
  id: string
  reference: string
  warehouseId: string
  supplier: string
  scheduleDate: Date
  status: OperationStatus
  responsibleUserId: string
  lines: ReceiptLine[]
}

export interface ReceiptLine {
  id: string
  receiptId: string
  productId: string
  quantity: number
  done: number
}

export interface Delivery {
  id: string
  reference: string
  warehouseId: string
  toContact: string
  scheduleDate: Date
  status: OperationStatus
  responsibleUserId: string
  lines: DeliveryLine[]
  shortages?: Array<{ productId: string; needed: number; available: number }>
}

export interface DeliveryLine {
  id: string
  deliveryId: string
  productId: string
  quantity: number
  done: number
}

export interface DashboardSummary {
  pendingReceipts: number
  lateReceipts: number
  pendingDeliveries: number
  waitingDeliveries: number
  lowStock: number
  totalProducts: number
  predictiveInsights?: string[]
}

export interface AIMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface AnomalyAlert {
  id: string
  type: "LARGE_ADJUSTMENT" | "AFTER_HOURS" | "SUSPICIOUS_TRANSFER" | "INCONSISTENT_LEDGER"
  message: string
  timestamp: Date
  severity: "LOW" | "MEDIUM" | "HIGH"
}

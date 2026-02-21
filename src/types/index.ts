// src/types/index.ts

export type AppwriteDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $uiId?: string; // Local ID for offline optimistic updates
};

export enum PlanType {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export interface Business extends AppwriteDocument {
  ownerId: string;
  name: string;
  gstin?: string;
  address?: string;
  logoFileId?: string;
  planType: PlanType;
}

export interface Customer extends AppwriteDocument {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
}

export interface Product extends AppwriteDocument {
  businessId: string;
  name: string;
  price: number;
  stock: number;
  taxRate: number; // e.g., 18 for 18%
  unit: string;
  sku?: string;
}

export enum InvoiceStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  PARTIAL = "partial",
}

export interface InvoiceItem {
  detailId: string; // unique id for the line item
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  taxRate: number;
}

export interface Invoice extends AppwriteDocument {
  businessId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string; // e.g. "INV-001"
  date: string; // ISO String
  totalAmount: number;
  status: InvoiceStatus;
  items: InvoiceItem[]; // Stored as JSON string in DB, parsed in app
  pdfUrl?: string;
}

export type SyncOperation = "create" | "update" | "delete";

export interface SyncQueueItem {
  id: number; // SQLite AI PK
  collection: string;
  documentId: string;
  operation: SyncOperation;
  payload: string; // JSON string
  createdAt: number;
}

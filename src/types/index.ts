// src/types/index.ts — InvoiceFlow v2

export type AppwriteDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
};

// ─── Enums ────────────────────────────────────────────────────────

export enum PlanType {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum InvoiceStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  PARTIAL = "partial",
  CANCELLED = "cancelled",
}

export enum DiscountType {
  NONE = "none",
  FLAT = "flat",
  PERCENT = "percent",
}

export enum PaymentMethod {
  CASH = "cash",
  UPI = "upi",
  CARD = "card",
  BANK = "bank",
}

export enum TaxType {
  GST = "gst",
  VAT = "vat",
  NONE = "none",
}

export enum StaffRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
  VIEWER = "viewer",
}

export enum SyncOperation {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

// ─── Core Entities ─────────────────────────────────────────────────

export interface Business extends AppwriteDocument {
  ownerId: string;
  name: string;
  tagline?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoFileId?: string;
  signatureFileId?: string;
  currency: string; // e.g. "INR"
  currencySymbol: string; // e.g. "₹"
  planType: PlanType;
  planExpiresAt?: string;
  invoicePrefix: string; // e.g. "INV"
  invoiceCounter: number;
  taxType: TaxType;
  isActive: boolean;
}

export interface Customer extends AppwriteDocument {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  balance: number;
  totalPurchases: number;
  totalInvoices: number;
  tags?: string[];
  notes?: string;
  isActive: boolean;
}

export interface Product extends AppwriteDocument {
  businessId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit: string; // pcs / kg / ltr / mtr / hrs
  price: number; // selling price
  costPrice?: number;
  mrp?: number;
  taxRate: number; // e.g. 18 for 18% GST
  hsnCode?: string;
  stock: number;
  lowStockThreshold: number;
  imageFileId?: string;
  isService: boolean;
  isActive: boolean;
}

export interface InvoiceLineItem {
  detailId: string;
  productId: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  price: number; // unit price at time of sale
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

export interface Invoice extends AppwriteDocument {
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  items: InvoiceLineItem[]; // parsed from JSON string in DB
  subTotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  termsConditions?: string;
  pdfFileId?: string;
  isRecurring: boolean;
  staffId?: string;
}

export interface StaffRoleDoc extends AppwriteDocument {
  businessId: string;
  userId: string;
  role: StaffRole;
  permissions: string[];
  invitedByUserId?: string;
  inviteEmail?: string;
  inviteStatus: "pending" | "accepted" | "rejected";
  isActive: boolean;
}

export interface Subscription extends AppwriteDocument {
  userId: string;
  businessId: string;
  planType: PlanType;
  status: "active" | "expired" | "cancelled" | "trial";
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  platform: "ios" | "android" | "web";
  storeProductId?: string;
  storeTransactionId?: string;
  autoRenew: boolean;
}

export interface MonthlyReport extends AppwriteDocument {
  businessId: string;
  month: string; // YYYY-MM
  totalInvoices: number;
  totalRevenue: number;
  totalTax: number;
  paidCount: number;
  unpaidCount: number;
}

export interface AppNotification extends AppwriteDocument {
  userId: string;
  businessId: string;
  type:
    | "payment_received"
    | "low_stock"
    | "invoice_due"
    | "sync_error"
    | "general";
  title: string;
  body: string;
  data?: string; // JSON
  isRead: boolean;
  readAt?: string;
}

// ─── Sync ──────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id: number;
  collection: string;
  documentId: string;
  operation: SyncOperation;
  payload: string; // JSON string
  retryCount: number;
  nextRetryAt?: number;
  createdAt: number;
}

// ─── UI Helpers ────────────────────────────────────────────────────

export type StatusVariant =
  | "paid"
  | "unpaid"
  | "partial"
  | "cancelled"
  | "overdue";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export type GSTSplit = {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

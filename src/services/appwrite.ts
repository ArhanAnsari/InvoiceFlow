// src/services/appwrite.ts — InvoiceFlow v2
import {
  Account,
  Client,
  Databases,
  Functions,
  ID,
  Permission,
  Query,
  Realtime,
  Role,
  Storage,
} from "appwrite";

// ─── Config ────────────────────────────────────────────────────────
export const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
  "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "699988ac001cd0857f48";
export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID ?? "invoiceflow_db";

// ─── Collection IDs ────────────────────────────────────────────────
export const COLLECTIONS = {
  BUSINESSES: process.env.EXPO_PUBLIC_COL_BUSINESSES ?? "businesses",
  CUSTOMERS: process.env.EXPO_PUBLIC_COL_CUSTOMERS ?? "customers",
  PRODUCTS: process.env.EXPO_PUBLIC_COL_PRODUCTS ?? "products",
  INVOICES: process.env.EXPO_PUBLIC_COL_INVOICES ?? "invoices",
  INVOICE_ITEMS: process.env.EXPO_PUBLIC_COL_INVOICE_ITEMS ?? "invoice_items",
  MONTHLY_REPORTS:
    process.env.EXPO_PUBLIC_COL_MONTHLY_REPORTS ?? "monthly_reports",
  SUBSCRIPTIONS: process.env.EXPO_PUBLIC_COL_SUBSCRIPTIONS ?? "subscriptions",
  STAFF_ROLES: process.env.EXPO_PUBLIC_COL_STAFF_ROLES ?? "staff_roles",
  BACKUPS: process.env.EXPO_PUBLIC_COL_BACKUPS ?? "backups",
  NOTIFICATIONS: process.env.EXPO_PUBLIC_COL_NOTIFICATIONS ?? "notifications",
} as const;

// ─── Bucket IDs ────────────────────────────────────────────────────
export const BUCKETS = {
  BUSINESS_ASSETS:
    process.env.EXPO_PUBLIC_BUCKET_BUSINESS_ASSETS ?? "business_assets",
  INVOICE_PDFS: process.env.EXPO_PUBLIC_BUCKET_INVOICE_PDFS ?? "invoice_pdfs",
  BACKUPS: process.env.EXPO_PUBLIC_BUCKET_BACKUPS ?? "backups",
} as const;

// ─── Function IDs ─────────────────────────────────────────────────
export const FUNCTION_IDS = {
  MONTHLY_REPORT_GENERATOR:
    process.env.EXPO_PUBLIC_FUNC_MONTHLY_REPORT_GENERATOR ??
    "monthly-report-generator",
  ANALYTICS_CALCULATOR:
    process.env.EXPO_PUBLIC_FUNC_ANALYTICS_CALCULATOR ?? "analytics-calculator",
  STOCK_DEDUCTION:
    process.env.EXPO_PUBLIC_FUNC_STOCK_DEDUCTION ?? "stock-deduction",
  SUBSCRIPTION_VALIDATOR:
    process.env.EXPO_PUBLIC_FUNC_SUBSCRIPTION_VALIDATOR ??
    "subscription-validator",
  BACKUP_CREATOR:
    process.env.EXPO_PUBLIC_FUNC_BACKUP_CREATOR ?? "backup-creator",
  CLEANUP_OLD_DATA:
    process.env.EXPO_PUBLIC_FUNC_CLEANUP_OLD_DATA ?? "cleanup-old-data",
} as const;

// ─── Client ────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

// ─── Helpers ───────────────────────────────────────────────────────
/** Build standard CRUD permissions for a user-owned document. */
export const userPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

export { client, ID, Permission, Query, Role };
export default client;

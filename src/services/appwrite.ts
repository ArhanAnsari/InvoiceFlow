// src/services/appwrite.ts — InvoiceFlow v2
import {
    Account,
    Client,
    Databases,
    Functions,
    ID,
    Permission,
    Query,
    Role,
    Storage,
} from "react-native-appwrite";

// ─── Config ────────────────────────────────────────────────────────
export const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
  "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "699988ac001cd0857f48";
export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID ?? "invoiceflow_db";
export const APPWRITE_PLATFORM =
  process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ?? "com.invoiceflow.app";

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
    "69bd07750000e7501c23",
  ANALYTICS_CALCULATOR:
    process.env.EXPO_PUBLIC_FUNC_ANALYTICS_CALCULATOR ?? "69bd0de80003198d6702",
  STOCK_DEDUCTION:
    process.env.EXPO_PUBLIC_FUNC_STOCK_DEDUCTION ?? "69bd0eb40034b3489ff3",
  SUBSCRIPTION_VALIDATOR:
    process.env.EXPO_PUBLIC_FUNC_SUBSCRIPTION_VALIDATOR ??
    "69bd0efb0032a680afbb",
  BACKUP_CREATOR:
    process.env.EXPO_PUBLIC_FUNC_BACKUP_CREATOR ?? "69bd10580032b46179b9",
  CLEANUP_OLD_DATA:
    process.env.EXPO_PUBLIC_FUNC_CLEANUP_OLD_DATA ?? "69bd13a9002cb553f5df",
} as const;

// ─── Client ────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setPlatform(APPWRITE_PLATFORM)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// ─── Helpers ───────────────────────────────────────────────────────
/** Build standard CRUD permissions for a user-owned document. */
export const userPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

export { client, ID, Permission, Query, Role };
export default client;

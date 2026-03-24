// src/services/database.ts
import * as SQLite from "expo-sqlite";
import { SyncQueueItem } from "../types";

const db = SQLite.openDatabaseSync("invoiceflow.db");

// Flag to track initialization state
let isInitialized = false;

export const initDatabase = async () => {
  if (isInitialized) {
    console.log("Database already initialized");
    return;
  }

  try {
    // Enable WAL mode first
    await db.execAsync("PRAGMA journal_mode = WAL");

    // Create all tables
    await db.execAsync(`
      -- Businesses Table
      CREATE TABLE IF NOT EXISTS businesses (
        "$id" TEXT PRIMARY KEY,
        ownerId TEXT NOT NULL,
        name TEXT NOT NULL,
        gstin TEXT,
        address TEXT,
        logoFileId TEXT,
        planType TEXT DEFAULT 'free',
        "$createdAt" TEXT,
        "$updatedAt" TEXT
      );

      -- Customers Table
      CREATE TABLE IF NOT EXISTS customers (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        balance REAL DEFAULT 0,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Products Table
      CREATE TABLE IF NOT EXISTS products (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        lowStockThreshold INTEGER DEFAULT 5,
        taxRate REAL DEFAULT 0,
        unit TEXT,
        sku TEXT,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Invoices Table
      CREATE TABLE IF NOT EXISTS invoices (
        "$id" TEXT PRIMARY KEY,
        businessId TEXT NOT NULL,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        invoiceNumber TEXT NOT NULL,
        date TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT DEFAULT 'unpaid',
        items TEXT,
        pdfUrl TEXT,
        "$createdAt" TEXT,
        "$updatedAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Invoice Items Table
      CREATE TABLE IF NOT EXISTS invoice_items (
        "$id" TEXT PRIMARY KEY,
        invoiceId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        hsnCode TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        taxRate REAL NOT NULL,
        taxAmount REAL NOT NULL,
        totalPrice REAL NOT NULL,
        "$createdAt" TEXT,
        isSynced INTEGER DEFAULT 1
      );

      -- Sync Queue Table (CRITICAL)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection TEXT NOT NULL,
        documentId TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT,
        createdAt INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- Notifications Table (Local)
      CREATE TABLE IF NOT EXISTS notifications (
        "$id" TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        isRead INTEGER DEFAULT 0,
        readAt TEXT,
        "$createdAt" TEXT,
        "$updatedAt" TEXT
      );
    `);

    // Verify critical tables exist
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_queue', 'invoices', 'customers', 'products')",
    );

    if (tables.length < 4) {
      console.warn("Warning: Not all expected tables were created");
    }

    // Handle migrations for existing database
    try {
      // Check if products table has lowStockThreshold column
      const productsColumns = await db.getAllAsync(
        "PRAGMA table_info(products)",
      );
      const hasLowStockThreshold = (productsColumns as any[]).some(
        (col: any) => col.name === "lowStockThreshold",
      );

      if (!hasLowStockThreshold) {
        console.log(
          "🔄 Migrating products table: adding lowStockThreshold column",
        );
        await db.execAsync(
          "ALTER TABLE products ADD COLUMN lowStockThreshold INTEGER DEFAULT 5",
        );
        console.log("✅ Migration complete: lowStockThreshold column added");
      }
    } catch (migrationError) {
      console.warn("Migration warning:", migrationError);
    }

    isInitialized = true;
    console.log("✅ Local Database Initialized Successfully");
  } catch (error) {
    console.error("❌ Failed to init local database:", error);
    // Don't throw - allow app to continue with limited functionality
  }
};

export const isDBInitialized = () => isInitialized;

// Generic Helpers
export const runQuery = async <T>(
  query: string,
  params: any[] = [],
): Promise<T[]> => {
  try {
    const result = await db.getAllAsync(query, params);
    return result as T[];
  } catch (e) {
    console.error("DB Query Error:", e);
    return [];
  }
};

export const addToSyncQueue = async (
  collection: string,
  documentId: string,
  operation: "create" | "update" | "delete",
  payload: any,
) => {
  if (!isInitialized) {
    console.warn("Database not initialized, skipping sync queue");
    return;
  }

  try {
    await db.runAsync(
      "INSERT INTO sync_queue (collection, documentId, operation, payload) VALUES (?, ?, ?, ?)",
      [collection, documentId, operation, JSON.stringify(payload)],
    );
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
  }
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  if (!isInitialized) {
    return [];
  }

  try {
    const result = await db.getAllAsync(
      "SELECT * FROM sync_queue ORDER BY createdAt ASC",
    );
    return result as SyncQueueItem[];
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return [];
  }
};

export const cleanupSyncQueue = async (ids: number[]) => {
  if (ids.length === 0 || !isInitialized) return;

  try {
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `DELETE FROM sync_queue WHERE id IN (${placeholders})`,
      ids,
    );
  } catch (error) {
    console.error("Failed to cleanup sync queue:", error);
  }
};

export const clearProblematicSyncQueue = async () => {
  if (!isInitialized) return;

  try {
    // Clear sync queue items that might have missing required fields
    // This allows users to retry or re-create those items
    await db.runAsync("DELETE FROM sync_queue");
    console.log("✅ Cleaned up sync queue of problematic items");
  } catch (error) {
    console.error("Failed to clear sync queue:", error);
  }
};

export default db;
